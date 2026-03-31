import type { Octokit } from '@octokit/rest'
import { invalidateRepos } from '~~/server/api/repos.get'
import { indexRepo } from '~~/server/utils/index-repo'
import { getMetadataForRepo } from '~~/server/utils/metadata'

export interface IndexReposOptions {
  filter?: string[]
  timeBudgetMs?: number
}

interface RepoProgress {
  repo: string
  indexed: number
  skipped: number
  totalStored: number
  currentPage: number
  complete: boolean
}

export interface IndexReposResult {
  repos: RepoProgress[]
  result: string
}

/**
 * Orchestrate indexing across all repos that need it.
 * Returns per-repo progress details and a human-readable summary.
 */
export async function indexRepos(octokit: Octokit, options: IndexReposOptions = {}): Promise<IndexReposResult> {
  const { filter, timeBudgetMs } = options

  const repos = await $fetch('/api/repos')

  // Check for repos with a non-zero cursor (partially indexed from a previous run)
  const allRepos = await useDrizzle().select({
    fullName: tables.repos.full_name,
    indexCursor: tables.repos.indexCursor,
  }).from(tables.repos).all()
  const cursorMap = new Map(allRepos.map(r => [r.fullName, r.indexCursor]))

  const progress: RepoProgress[] = []

  for (const repo of repos) {
    const cursor = cursorMap.get(repo.repo) || 0
    const needsIndexing = !repo.indexed || cursor > 0
    if (!needsIndexing || (filter && !filter.includes(repo.repo)))
      continue

    try {
      const [owner, name] = repo.repo.split('/')
      const meta = await getMetadataForRepo(owner!, name!)
      if (!meta)
        continue

      const result = await indexRepo(octokit, meta, { timeBudgetMs })

      progress.push({
        repo: repo.repo,
        indexed: result.indexed,
        skipped: result.skipped,
        totalStored: result.totalStored,
        currentPage: result.currentPage,
        complete: result.complete,
      })

      if (!result.complete) {
        // Stop processing more repos — this one consumed the time budget
        break
      }
    }
    catch (e) {
      console.error('Error indexing', repo.repo, e)
    }
  }

  // Invalidate the repos list cache so the next run sees updated state
  if (progress.length) {
    await invalidateRepos().catch(e => console.warn('Failed to invalidate repos cache:', e))
  }

  return {
    repos: progress,
    result: formatResult(progress),
  }
}

function formatResult(progress: RepoProgress[]): string {
  if (!progress.length)
    return 'No repos needed indexing.'

  const parts: string[] = []

  const complete = progress.filter(r => r.complete)
  const partial = progress.filter(r => !r.complete)

  for (const r of complete) {
    parts.push(`Indexed ${r.repo}: ${r.totalStored} issues stored (${r.indexed} new, ${r.skipped} unchanged)`)
  }
  for (const r of partial) {
    parts.push(`Partially indexed ${r.repo}: ${r.totalStored} issues stored so far, page ${r.currentPage} (${r.indexed} new this run, ${r.skipped} unchanged). Will resume on next invocation.`)
  }

  return parts.join(' ')
}
