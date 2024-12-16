import type { TaskPayload as IndexRepoTaskPayload } from '~~/server/tasks/index-repo'
import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'

export interface TaskPayload {
  /**
   * Repos to add
   */
  repos: string[]

  /**
   * Index added repos
   */
  index?: boolean
}

export default defineTask({
  meta: {
    name: 'add-repo',
    description: 'Add new repositories',
  },
  async run(ctx) {
    const payload = ctx.payload as unknown as TaskPayload
    const octokit = new Octokit({ auth: useRuntimeConfig().github.token })

    for (const repo of payload.repos) {
      const [owner, name] = repo.split('/')
      if (await getMetadataForRepo(owner!, name!))
        continue

      const fetchedRepo = await octokit.repos.get({ owner: owner!, repo: name! })

      if (!fetchedRepo.data || fetchedRepo.data.private) {
        continue
      }

      await setMetadataForRepo(owner!, name!, {
        id: fetchedRepo.data.id,
        node_id: fetchedRepo.data.node_id,
        name: fetchedRepo.data.name,
        full_name: fetchedRepo.data.full_name,
        private: fetchedRepo.data.private,
        indexed: false,
      })
    }

    if (payload.index) {
      return runTask('index-repo', {
        payload: {
          filter: payload.repos,
        } satisfies IndexRepoTaskPayload,
      })
    }

    return {
      result: `Added repositories (${payload.repos.join(', ')}) ${payload.index ? ' and started indexing' : ''}.`,
    }
  },
})
