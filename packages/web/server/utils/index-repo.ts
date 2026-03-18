import type { Octokit } from '@octokit/rest'
import type { InstallationRepo } from '~~/server/utils/metadata'

import { count } from 'drizzle-orm'
import { indexIssue } from '~~/server/utils/embeddings'
import { currentIndexVersion } from '~~/server/utils/metadata'

export interface IndexRepoOptions {
  /** Time budget in milliseconds. Indexing will stop after this. Default: 20_000 (20s) */
  timeBudgetMs?: number
}

export interface IndexRepoResult {
  indexed: number
  skipped: number
  /** Whether all pages were processed (false = timed out, needs another invocation) */
  complete: boolean
  /** Current page the cursor is at (0 if complete) */
  currentPage: number
  /** Number of issues already stored in the DB for this repo */
  totalStored: number
}

/**
 * Index issues for a repository with time-bounded execution.
 *
 * Uses the `index_cursor` column on the repos table to track which GitHub API
 * page we've reached. When the time budget is exhausted, it saves the cursor
 * so the next invocation continues where it left off.
 *
 * When all pages are processed, marks the repo as fully indexed and resets
 * the cursor to 0.
 */
export async function indexRepo(octokit: Octokit, repo: InstallationRepo, options: IndexRepoOptions = {}): Promise<IndexRepoResult> {
  const { timeBudgetMs = 20_000 } = options

  if (repo.private) {
    return { indexed: 0, skipped: 0, complete: true, currentPage: 0, totalStored: 0 }
  }

  const [owner, name] = repo.full_name.split('/')
  const drizzle = useDrizzle()

  const repoRow = await drizzle.select({ repoId: tables.repos.id, indexCursor: tables.repos.indexCursor }).from(tables.repos).where(eq(tables.repos.full_name, `${owner}/${name}`.toLowerCase())).get()
  if (!repoRow) {
    console.error('Failed to find repo row for', `${owner}/${name}`)
    return { indexed: 0, skipped: 0, complete: true, currentPage: 0, totalStored: 0 }
  }

  const startPage = repoRow.indexCursor || 1
  console.log('starting to index', `${repo.full_name}`, startPage > 1 ? `(resuming from page ${startPage})` : '')

  let indexed = 0
  let skipped = 0
  let currentPage = startPage
  const deadline = Date.now() + timeBudgetMs

  /** Count how many issues are stored in the DB for this repo */
  async function getStoredCount(): Promise<number> {
    const result = await drizzle.select({ count: count() }).from(tables.issues).where(eq(tables.issues.repoId, repoRow!.repoId)).get()
    return result?.count ?? 0
  }

  for await (const response of octokit.paginate.iterator(octokit.rest.issues.listForRepo, {
    owner: owner!,
    repo: name!,
    state: 'all',
    per_page: 100,
    page: startPage,
  })) {
    // Check time budget before processing each page
    if (Date.now() >= deadline) {
      console.log(`Time budget exhausted for ${repo.full_name} at page ${currentPage}, saving cursor`)
      await drizzle.update(tables.repos).set({ indexCursor: currentPage }).where(eq(tables.repos.id, repo.id))
      const totalStored = await getStoredCount()
      console.log('indexed', indexed, 'issues (skipped', skipped, `, total stored: ${totalStored}) from`, `${owner}/${name}`, '(partial, will resume)')
      return { indexed, skipped, complete: false, currentPage, totalStored }
    }

    // Process each page in batches of 10 concurrent requests
    const issues = response.data
    for (let i = 0; i < issues.length; i += 10) {
      const batch = issues.slice(i, i + 10)
      const results = await Promise.allSettled(
        batch.map(issue => indexIssue(issue, { owner: { login: owner! }, name: name! })),
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value)
            indexed++
          else skipped++
        }
        else {
          console.error('Failed to index issue:', r.reason)
        }
      }

      // Check time budget between batches within a page too
      if (Date.now() >= deadline) {
        // Save cursor at current page so we re-process it (some issues in this page may not have been done)
        console.log(`Time budget exhausted for ${repo.full_name} mid-page ${currentPage}, saving cursor`)
        await drizzle.update(tables.repos).set({ indexCursor: currentPage }).where(eq(tables.repos.id, repo.id))
        const totalStored = await getStoredCount()
        console.log('indexed', indexed, 'issues (skipped', skipped, `, total stored: ${totalStored}) from`, `${owner}/${name}`, '(partial, will resume)')
        return { indexed, skipped, complete: false, currentPage, totalStored }
      }
    }

    // Check rate limiting
    const remaining = Number.parseInt(response.headers['x-ratelimit-remaining'] || '999')
    if (remaining < 100) {
      console.info(remaining, 'requests remaining')
    }
    if (remaining < 50) {
      const resetAt = Number.parseInt(response.headers['x-ratelimit-reset'] || '0') * 1000
      const waitMs = Math.max(resetAt - Date.now(), 0) + 1000
      // If the rate limit wait would exceed our time budget, save and bail
      if (Date.now() + waitMs >= deadline) {
        console.warn(`Rate limit pause (${Math.ceil(waitMs / 1000)}s) would exceed time budget, saving cursor at page ${currentPage}`)
        await drizzle.update(tables.repos).set({ indexCursor: currentPage + 1 }).where(eq(tables.repos.id, repo.id))
        const totalStored = await getStoredCount()
        return { indexed, skipped, complete: false, currentPage: currentPage + 1, totalStored }
      }
      console.warn(`Rate limit low (${remaining}), pausing for ${Math.ceil(waitMs / 1000)}s`)
      await new Promise(resolve => setTimeout(resolve, waitMs))
    }

    currentPage++
  }

  // All pages processed - mark as fully indexed and reset cursor
  await drizzle.update(tables.repos).set({
    indexed: currentIndexVersion,
    indexCursor: 0,
  }).where(eq(tables.repos.id, repo.id))

  const totalStored = await getStoredCount()
  console.log('indexed', indexed, 'issues (skipped', skipped, `, total stored: ${totalStored}) from`, `${owner}/${name}`, '(complete)')
  return { indexed, skipped, complete: true, currentPage: 0, totalStored }
}
