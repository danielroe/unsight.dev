import type { IssueKeys, IssueMetadata, Label } from '~~/server/utils/embeddings'
import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'

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

  const issues = [] as Array<Pick<IssueMetadata, Exclude<IssueKeys, 'labels'>> & { score: number, labels?: Array<{ name: string, color?: string }> }>

  for (const match of results?.matches || []) {
    const issueMetadata = {
      ...match.metadata,
      labels: match.metadata?.labels ? JSON.parse(match.metadata.labels as string) as Label[] : [],
    } as IssueMetadata
    if (issueMetadata.owner === owner && issueMetadata.repository === repo && issueMetadata.number.toString() === number) {
      continue
    }
    issues.push({
      ...issueMetadata,
      labels: issueMetadata?.labels?.map(l => typeof l === 'string' ? { name: l } : l) || [],
      score: match.score,
    })
  }

  return issues
}, {
  swr: true,
  getKey(event) {
    const { owner, repo, number } = getRouterParams(event)
    return `v${2 + currentIndexVersion}:issue:${owner}:${repo}:${number}`.toLowerCase()
  },
})
