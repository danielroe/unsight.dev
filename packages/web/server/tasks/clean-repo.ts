import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'
import { getStoredEmbeddingsForRepo, removeIssue } from '~~/server/utils/embeddings'
import { getMetadataForRepo } from '~~/server/utils/metadata'

export interface TaskPayload {
  /**
   * Repos to clean
   */
  repos?: string[]
}

export default defineTask({
  meta: {
    name: 'clean-repo',
    description: 'Clean up transferred issues',
  },
  async run(ctx) {
    const payload = ctx.payload as unknown as TaskPayload
    const octokit = new Octokit({ auth: useRuntimeConfig().github.token })

    const results: Record<string, { scanned: number, removed: number }> = {}

    const repos = payload.repos || await $fetch('/api/repos').then(r => r.map(r => r.repo)) || []

    for (const repo of repos) {
      const [owner, name] = repo.split('/')

      // Check if repo exists in our metadata
      const repoMetadata = await getMetadataForRepo(owner!, name!)
      if (!repoMetadata) {
        continue
      }

      // Get all indexed issues for this repo
      const indexedIssues = await getStoredEmbeddingsForRepo(owner!, name!)
      if (!indexedIssues || !indexedIssues.length) {
        results[repo] = { scanned: 0, removed: 0 }
        continue
      }

      let removedCount = 0

      // Process issues in batches to respect API rate limits
      for (let i = 0; i < indexedIssues.length; i += 50) {
        const batch = indexedIssues.slice(i, i + 50)

        // Fetch current status of these issues
        await Promise.all(batch.map(async (issue) => {
          const number = issue.metadata?.number
          if (!number) {
            console.log(`No issue number found for issue in ${repo}`)
            return
          }

          try {
            const response = await octokit.issues.get({
              owner: owner!,
              repo: name!,
              issue_number: number,
              request: {
                redirect: 'manual',
              },
            })

            // Only remove transferred issues (301 redirect) or issues that belong to a different repo
            if (response.status as 301 | 200 === 301
              || (response.data.repository?.owner && response.data.repository.owner.login !== owner)
              || (response.data.repository?.name && response.data.repository.name !== name)) {
              console.log(`Removing transferred issue: https://github.com/${owner}/${name}/issues/${number}`)
              await removeIssue(
                { number },
                { owner: { login: owner! }, name: name! },
              )
              removedCount++
            }
          }
          catch (error) {
            console.error(error)
          }
        }))

        await new Promise(resolve => setTimeout(resolve, 1000 * (batch.length / 50))) // Wait for 1 second to avoid hitting rate limits
      }

      results[repo] = {
        scanned: indexedIssues.length,
        removed: removedCount,
      }

      console.log(`${repo} (scanned: ${indexedIssues.length}, removed: ${removedCount})`)
    }

    return {
      result: `Cleaned repositories: ${Object.entries(results)
        .map(([repo, stats]) => `${repo} (scanned: ${stats.scanned}, removed: ${stats.removed})`)
        .join(', ')}`,
    }
  },
})
