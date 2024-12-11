import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { clusterEmbeddings } from '~~/server/utils/cluster'
import { getStoredEmbeddingsForRepo, type IssueMetadata } from '~~/server/utils/embeddings'

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
        issues.push(res.metadata)
        embeddings.push(res.embeddings)
      }
      return [issues, embeddings] as const
    })

  const clusters = clusterEmbeddings(issues, embeddings)
  console.log('generated', clusters.length, 'clusters from', issues.length, embeddings.length)

  return clusters
    .map(cluster => cluster.map(i => ({
      owner: i.owner,
      repository: i.repository,
      number: i.number,
      title: i.title,
      url: i.url,
      updated_at: i.updated_at,
      avgSimilarity: i.avgSimilarity,
      labels: i.labels?.map((l) => {
        try {
          return l.startsWith('{') ? JSON.parse(l) as { name: string, color?: string } : l
        }
        catch {
          return l
        }
      }),
    })))
}, {
  swr: true,
  getKey(event) {
    const { owner, repo } = getRouterParams(event)
    return `v1:clusters:${owner}:${repo}`.toLowerCase()
  },
})
