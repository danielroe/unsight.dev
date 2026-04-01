import type { Octokit } from '@octokit/rest'
import { invalidateRepos } from '#server/api/repos.get'
import { indexRepo } from '#server/utils/index-repo'
import { currentIndexVersion, getMetadataForRepo } from '#server/utils/metadata'

export interface IndexReposOptions {
  filter?: string[]
  timeBudgetMs?: number
}

interface RepoProgress {
  repo: string
  /** DB indexed version (compared against currentIndexVersion) */
  indexedVersion: number
  indexCursor: number
  /** Number of issues newly indexed this run */
  indexed: number
  /** Number of issues skipped (unchanged) this run */
  skipped: number
  totalStored: number
  currentPage: number
  complete: boolean
}

export interface IndexReposResult {
  currentIndexVersion: number
  repos: RepoProgress[]
  result: string
}

/**
 * Orchestrate indexing across all repos that need it.
 * Returns per-repo progress details and a human-readable summary.
 */
export async function indexRepos(octokit: Octokit, options: IndexReposOptions = {}): Promise<IndexReposResult> {
  const { filter, timeBudgetMs } = options

  // Check for repos with a non-zero cursor (partially indexed from a previous run)
  const repos = await useDrizzle().select({
    fullName: tables.repos.full_name,
    indexCursor: tables.repos.indexCursor,
    indexed: tables.repos.indexed,
  }).from(tables.repos).all()

  const progress: RepoProgress[] = []
  let didIndex = false

  for (const repo of repos) {
    const needsIndexing = repo.indexed !== currentIndexVersion || repo.indexCursor > 0
    if (!needsIndexing || (filter && !filter.includes(repo.fullName))) {
      progress.push({
        repo: repo.fullName,
        indexedVersion: repo.indexed,
        indexCursor: repo.indexCursor,
        indexed: 0,
        skipped: 0,
        totalStored: 0,
        currentPage: 0,
        complete: true,
      })
      continue
    }

    try {
      const [owner, name] = repo.fullName.split('/')
      const meta = await getMetadataForRepo(owner!, name!)
      if (!meta)
        continue

      const result = await indexRepo(octokit, meta, { timeBudgetMs })
      didIndex = true

      progress.push({
        repo: repo.fullName,
        indexedVersion: repo.indexed,
        indexCursor: repo.indexCursor,
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
      console.error('Error indexing', repo.fullName, e)
    }
  }

  // Invalidate the repos list cache so the next run sees updated state
  if (didIndex) {
    await invalidateRepos().catch(e => console.warn('Failed to invalidate repos cache:', e))
  }

  return {
    currentIndexVersion,
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
