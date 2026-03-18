import type { IssueMetadata } from '~~/server/utils/embeddings'
import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { findDuplicates } from '~~/server/utils/cluster'
import { getStoredEmbeddingsForRepos } from '~~/server/utils/embeddings'

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
        if (res.metadata.state !== 'closed') {
          issues.push(res.metadata)
          embeddings.push(res.embeddings)
        }
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
    state: i.state,
    updated_at: i.updated_at,
    labels: i.labels,
  })))
}, {
  swr: true,
  getKey(event) {
    const { id } = getRouterParams(event)
    return `v${2 + currentIndexVersion}:duplicates:dashboard:${id}`.toLowerCase()
  },
})
