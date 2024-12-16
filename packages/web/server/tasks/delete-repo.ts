import { defineTask } from 'nitropack/runtime'
import { removeStoredEmbeddingsForRepo } from '../utils/embeddings'

export interface TaskPayload {
  /**
   * Repos to delete
   */
  repos: string[]
}

export default defineTask({
  meta: {
    name: 'delete-repo',
    description: 'Delete repos',
  },
  async run(ctx) {
    const { repos } = ctx.payload as unknown as TaskPayload

    for (const repo of repos) {
      const [owner, name] = repo.split('/')
      await removeMetadataForRepo(owner!, name!)
      await removeStoredEmbeddingsForRepo(owner!, name!)
    }

    return {
      result: `Deleted repositories (${repos.join(', ')}).`,
    }
  },
})
