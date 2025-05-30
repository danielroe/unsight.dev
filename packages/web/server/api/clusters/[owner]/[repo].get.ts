import type { IssueMetadata } from '~~/server/utils/embeddings'

import { randomUUID } from 'uncrypto'
import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { clusterEmbeddings, generateClusterName } from '~~/server/utils/cluster'
import { getStoredEmbeddingsForRepo } from '~~/server/utils/embeddings'

let invalidateKey = ''
export default defineCachedCorsEventHandler(async (event) => {
  const { owner, repo } = getRouterParams(event)
  if (!owner || !repo) {
    throw createError({
      status: 400,
      message: 'Invalid repository',
    })
  }

  const [issues, embeddings] = await getStoredEmbeddingsForRepo(owner, repo)
    .then((r) => {
      const issues: IssueMetadata[] = []
      const embeddings: number[][] = []

      for (const res of r) {
        if (res.state !== 'closed') {
          issues.push(res.metadata)
          embeddings.push(res.embeddings)
        }
      }
      return [issues, embeddings] as const
    })

  const clusters = clusterEmbeddings(issues, embeddings)
  console.log('generated', clusters.length, 'clusters from', issues.length, embeddings.length)

  // Generate titles for each cluster
  const clustersWithTitles = await Promise.all(clusters.map(async (cluster) => {
    // Use other clusters for contrast when generating names
    const otherClusters = clusters.filter(c => c !== cluster).map(c => c.map(issue => ({
      number: issue.number,
      title: issue.title,
    })))

    // Generate a unique name for this cluster
    const title = await generateClusterName(
      cluster.map(issue => ({
        number: issue.number,
        title: issue.title,
        description: issue.description,
      })),
      otherClusters,
    )

    // Return the cluster with its generated title
    return {
      title,
      issues: cluster.map(i => ({
        owner: i.owner,
        repository: i.repository,
        number: i.number,
        title: i.title,
        url: i.url,
        updated_at: i.updated_at,
        state: i.state,
        avgSimilarity: i.avgSimilarity,
        labels: i.labels,
      })),
    }
  }))

  return clustersWithTitles
}, {
  swr: true,
  maxAge: 60 * 60 * 24,
  staleMaxAge: 60 * 60 * 24,
  shouldInvalidateCache: event => !!invalidateKey && getHeaders(event).invalidate === invalidateKey,
  // shouldBypassCache: () => !!import.meta.dev,
  getKey(event) {
    const { owner, repo } = getRouterParams(event)
    return `v${3 + currentIndexVersion}:clusters:${owner}:${repo}`.toLowerCase()
  },
})

export async function invalidateCluster(owner: string, repo: string) {
  invalidateKey = randomUUID()
  await $fetch(`/api/clusters/${owner}/${repo}`, {
    headers: {
      invalidate: invalidateKey,
    },
  })
  invalidateKey = ''
}
