import type { IssueMetadata } from '~~/server/utils/embeddings'
import { randomUUID } from 'uncrypto'
import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { findDuplicates } from '~~/server/utils/cluster'
import { getStoredEmbeddingsForRepo } from '~~/server/utils/embeddings'

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
        if (res.metadata.state !== 'closed') {
          issues.push(res.metadata)
          embeddings.push(res.embeddings)
        }
      }
      return [issues, embeddings] as const
    })

  const query = getQuery(event)
  const duplicateThreshold = query.threshold ? Number.parseFloat(String(query.threshold)) : undefined
  const duplicates = findDuplicates(issues, embeddings, { duplicateThreshold })

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
  maxAge: 60 * 60 * 24,
  staleMaxAge: 60 * 60 * 24,
  shouldInvalidateCache: (event) => {
    const key = getHeaders(event).invalidate
    return !!key && invalidateKeys.delete(key)
  },
  getKey(event) {
    const { owner, repo } = getRouterParams(event)
    return `v${2 + currentIndexVersion}:duplicates:${owner}:${repo}`.toLowerCase()
  },
})

export async function invalidateDuplicates(owner: string, repo: string) {
  const key = randomUUID()
  invalidateKeys.add(key)
  await $fetch(`/api/duplicates/${owner}/${repo}`, {
    headers: {
      invalidate: key,
    },
  })
}
