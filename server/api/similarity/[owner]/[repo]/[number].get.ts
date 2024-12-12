import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { storageKeyForIssue } from '~~/server/utils/embeddings'
import type { IssueMetadata } from '~~/server/utils/embeddings'

export default defineCachedCorsEventHandler(async (event) => {
  const { owner, repo, number } = getRouterParams(event)

  if (!owner || !repo || !number) {
    throw createError({
      status: 400,
      message: 'Invalid repository',
    })
  }

  const vectorize = typeof hubVectorize !== 'undefined' ? hubVectorize('issues') : null

  // TODO: support similar repos
  const issueVector = await vectorize?.getByIds([storageKeyForIssue(owner, repo, number)])
  const results = issueVector?.[0]
    ? await vectorize?.query(issueVector[0].values, {
      returnMetadata: 'all',
      topK: 10,
      filter: {
        owner,
      },
    })
    : undefined

  return results?.matches.map((m) => {
    const issueMetadata = m.metadata as IssueMetadata

    return {
      ...issueMetadata,
      labels: issueMetadata?.labels?.map((l) => {
        try {
          return l.startsWith('{') ? JSON.parse(l) as { name: string, color?: string } : l
        }
        catch {
          return l
        }
      }),
      score: m.score,
    }
  }) || []
}, {
  swr: true,
  getKey(event) {
    const { owner, repo, number } = getRouterParams(event)
    return `v1:issue:${owner}:${repo}:${number}`.toLowerCase()
  },
})
