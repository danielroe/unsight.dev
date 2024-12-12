import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'
import { indexRepo } from '~~/server/routes/github/webhook.post'

interface TaskPayload {
  filter?: string[]
  tryResolveMeta?: boolean
}

export default defineTask({
  meta: {
    name: 'index-repo',
    description: 'Index repositories',
  },
  async run({ payload }: { payload: TaskPayload }) {
    const octokit = new Octokit({ auth: useRuntimeConfig().github.token })

    const repos = await $fetch('/api/repos')
    const indexed: string[] = []
    let count = 1
    for (const repo of repos) {
      if (repo.indexed || (payload.filter && !payload.filter.includes(repo.repo))) continue

      try {
        const [owner, name] = repo.repo.split('/')
        let meta = await getMetadataForRepo(owner!, name!)
        if (!meta) {
          if (payload.tryResolveMeta !== true) {
            continue
          }

          const fetchedRepo = await octokit.repos.get({ owner: owner!, repo: name! })

          if (!fetchedRepo.data || fetchedRepo.data.private) {
            continue
          }

          meta = {
            id: fetchedRepo.data.id,
            node_id: fetchedRepo.data.node_id,
            name: fetchedRepo.data.name,
            full_name: fetchedRepo.data.full_name,
            private: fetchedRepo.data.private,
            indexed: false,
          }
        }

        await indexRepo(octokit, meta)
        indexed.push(repo.repo)
        await setMetadataForRepo(owner!, name!, { ...meta, indexed: true })
      }
      catch (e) {
        console.error(e)
      }

      if (count++ > 30) {
        break
      }
    }

    return indexed
  },
})
