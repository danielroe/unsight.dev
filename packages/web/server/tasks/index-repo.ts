import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'
import { indexRepo } from '~~/server/utils/index-repo'

export interface TaskPayload {
  /**
   * Filter repositories to index
   */
  filter?: string[]
  /**
   * Time budget in milliseconds per repo (default: 20s)
   */
  timeBudgetMs?: number
}

export default defineTask({
  meta: {
    name: 'index-repo',
    description: 'Index repositories',
  },
  async run(ctx) {
    const payload = ctx.payload as unknown as TaskPayload & { _context?: { github?: { token: string } } }
    const github = payload._context?.github || useRuntimeConfig().github
    const octokit = new Octokit({ auth: github.token })

    const repos = await $fetch('/api/repos')
    const indexed: string[] = []
    const partial: string[] = []

    // Also check for repos with a non-zero cursor (partially indexed from a previous run)
    const allRepos = await useDrizzle().select({
      fullName: tables.repos.full_name,
      indexCursor: tables.repos.indexCursor,
    }).from(tables.repos).all()
    const cursorMap = new Map(allRepos.map(r => [r.fullName, r.indexCursor]))

    for (const repo of repos) {
      const cursor = cursorMap.get(repo.repo) || 0
      const needsIndexing = !repo.indexed || cursor > 0
      if (!needsIndexing || (payload.filter && !payload.filter.includes(repo.repo)))
        continue

      try {
        const [owner, name] = repo.repo.split('/')
        const meta = await getMetadataForRepo(owner!, name!)
        if (!meta)
          continue

        const result = await indexRepo(octokit, meta, { timeBudgetMs: payload.timeBudgetMs })

        if (result.complete) {
          indexed.push(repo.repo)
        }
        else {
          partial.push(repo.repo)
          // Stop processing more repos — this one consumed the time budget
          break
        }
      }
      catch (e) {
        console.error(e)
      }
    }

    const parts = []
    if (indexed.length)
      parts.push(`Fully indexed: ${indexed.join(', ')}`)
    if (partial.length)
      parts.push(`Partially indexed (will resume): ${partial.join(', ')}`)
    if (!parts.length)
      parts.push('No repos needed indexing')

    return {
      result: `${parts.join('. ')}.`,
    }
  },
})
