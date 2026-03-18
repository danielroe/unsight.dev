import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'
import { indexRepos } from '~~/server/utils/index-repos'

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

    return await indexRepos(octokit, {
      filter: payload.filter,
      timeBudgetMs: payload.timeBudgetMs,
    })
  },
})
