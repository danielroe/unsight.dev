import type { IssueMetadata } from '#server/utils/embeddings'

import { defineCachedCorsEventHandler } from '#server/utils/cached-cors'
import { clusterEmbeddings, generateClusterName } from '#server/utils/cluster'
import { getStoredEmbeddingsForRepos } from '#server/utils/embeddings'

export default defineCachedCorsEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'Dashboard ID is required' })
  }

  const repoIds = await getDashboardRepoIds(id)
  if (!repoIds.length) {
    throw createError({ statusCode: 404, message: 'Dashboard not found or has no repositories' })
  }

  const [issues, embeddings] = await getStoredEmbeddingsForRepos(repoIds)
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
  console.log('generated', clusters.length, 'cross-repo clusters from', issues.length, 'issues across', repoIds.length, 'repos')

  // Generate titles for each cluster
  const clustersWithTitles = await Promise.all(clusters.map(async (cluster) => {
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

  return clustersWithTitles
}, {
  swr: true,
  maxAge: 60 * 60 * 24,
  staleMaxAge: 60 * 60 * 24,
  getKey(event) {
    const { id } = getRouterParams(event)
    return `v${3 + currentIndexVersion}:clusters:dashboard:${id}`.toLowerCase()
  },
})
