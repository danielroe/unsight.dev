import type { IssueMetadata } from '#server/utils/embeddings'

import { defineCachedCorsEventHandler } from '#server/utils/cached-cors'
import { clusterEmbeddings, generateClusterName } from '#server/utils/cluster'
import { getStoredEmbeddingsForRepo } from '#server/utils/embeddings'
import { randomUUID } from 'uncrypto'

const invalidateKeys = new Set<string>()
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

  const query = getQuery(event)
  const similarityThreshold = query.threshold ? Number.parseFloat(String(query.threshold)) : undefined
  const clusters = clusterEmbeddings(issues, embeddings, similarityThreshold)
  console.log('generated', clusters.length, 'clusters from', issues.length, embeddings.length)

  // Generate titles for each cluster, with limited concurrency
  const concurrency = 5
  const clustersWithTitles: Array<{
    title: string
    issues: Array<{
      owner: string
      repository: string
      number: number
      title: string
      url: string
      updated_at: string
      state: string
      avgSimilarity: number
      labels: Array<string | { name: string, color?: string }>
    }>
  }> = []

  for (let i = 0; i < clusters.length; i += concurrency) {
    const batch = clusters.slice(i, i + concurrency)
    const results = await Promise.all(batch.map(async (cluster) => {
      const otherClusters = clusters.filter(c => c !== cluster).map(c => c.map(issue => ({
        number: issue.number,
        title: issue.title,
      })))

      const title = await generateClusterName(
        cluster.map(issue => ({
          number: issue.number,
          title: issue.title,
          description: issue.description,
        })),
        otherClusters,
      )

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
    clustersWithTitles.push(...results)
  }

  return clustersWithTitles
}, {
  swr: true,
  maxAge: 60 * 60 * 24,
  staleMaxAge: 60 * 60 * 24,
  shouldInvalidateCache: (event) => {
    const key = getHeaders(event).invalidate
    return !!key && invalidateKeys.delete(key)
  },
  // shouldBypassCache: () => !!import.meta.dev,
  getKey(event) {
    const { owner, repo } = getRouterParams(event)
    return `v${3 + currentIndexVersion}:clusters:${owner}:${repo}`.toLowerCase()
  },
})

export async function invalidateCluster(owner: string, repo: string) {
  const key = randomUUID()
  invalidateKeys.add(key)
  await $fetch(`/api/clusters/${owner}/${repo}`, {
    headers: {
      invalidate: key,
    },
  })
}
