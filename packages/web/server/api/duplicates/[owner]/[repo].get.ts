import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { findDuplicates } from '~~/server/utils/cluster'
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

  const duplicates = findDuplicates(issues, embeddings)

  return duplicates.map(issues => issues.map(i => ({
    owner: i.owner,
    score: Math.round(i.score * 100) / 100,
    repository: i.repository,
    number: i.number,
    title: i.title,
    url: i.url,
    updated_at: i.updated_at,
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
    return `v1:duplicates:${owner}:${repo}`.toLowerCase()
  },
})
