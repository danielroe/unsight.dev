import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'
import { indexRepo } from '~~/server/routes/github/webhook.post'

export default defineTask({
  meta: {
    name: 'index-repo',
    description: 'Index repositories',
  },
  async run() {
    const octokit = new Octokit({ auth: useRuntimeConfig().github.token })

    const repos = await $fetch('/api/repos')
    const indexed: string[] = []
    let count = 1
    for (const repo of repos) {
      if (repo.indexed)
        continue

      try {
        const [owner, name] = repo.repo.split('/')
        const meta = await getMetadataForRepo(owner!, name!)
        if (!meta)
          continue

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
