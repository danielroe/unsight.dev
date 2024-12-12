import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { getStoredMetadataForIssue, storageKeyForIssue, type IssueMetadata } from '~~/server/utils/embeddings'

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
      filter: {
        owner,
      },
    })
    : undefined

  return await Promise.all(results?.matches.map(async (m) => {
    const issueMetadata = m.metadata as IssueMetadata
    const groups = m.id.match(/^issue:(?<owner>[^:]+):(?<repo>[^:]+):(?<number>\d+)$/)?.groups
    if (!groups) {
      console.error('Invalid match', m.id)
      return
    }

    const issue = await getStoredMetadataForIssue(groups.owner!, groups.repo!, parseInt(groups.number!))

    return {
      ...issue,
      labels: issue?.labels?.map((l) => {
        try {
          return l.startsWith('{') ? JSON.parse(l) as { name: string, color?: string } : l
        }
        catch {
          return l
        }
      }),
      ...issueMetadata,
      score: m.score,
    }
  }) || [])
}, {
  swr: true,
  getKey(event) {
    const { owner, repo, number } = getRouterParams(event)
    return `v1:issue:${owner}:${repo}:${number}`.toLowerCase()
  },
})
