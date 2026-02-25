import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'
import { indexRepo } from '~~/server/routes/github/webhook.post'
import { currentIndexVersion } from '~~/server/utils/metadata'

export interface TaskPayload {
  /**
   * Filter repositories to index
   */
  filter?: string[]
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
    let count = 1
    for (const repo of repos) {
      if (repo.indexed || (payload.filter && !payload.filter.includes(repo.repo)))
        continue

      try {
        const [owner, name] = repo.repo.split('/')
        const meta = await getMetadataForRepo(owner!, name!)
        if (!meta)
          continue

        await indexRepo(octokit, meta)

        // Mark indexed immediately so progress survives timeouts
        await useDrizzle().update(tables.repos).set({ indexed: currentIndexVersion }).where(eq(tables.repos.id, meta.id))
        indexed.push(repo.repo)
      }
      catch (e) {
        console.error(e)
      }

      if (count++ > 30) {
        break
      }
    }

    return {
      result: `Indexed repositories (${indexed.join(', ')}).`,
    }
  },
})
