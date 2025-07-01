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
  const results = issueVector?.[0] && await vectorize?.query(issueVector[0].values, {
    returnMetadata: 'all',
    topK: 20,
    filter: {
      owner,
    },
  })

  const issues = [] as Array<Pick<IssueMetadata, Exclude<IssueKeys, 'labels'>> & { score: number, labels?: Array<{ name: string, color?: string }> }>

  for (const match of results?.matches || []) {
    const labels = typeof match.metadata?.labels === 'string' ? JSON.parse(match.metadata.labels) as Label[] : match.metadata?.labels as string[] || []
    const issueMetadata = {
      ...match.metadata,
      labels: labels.map(l => typeof l === 'string' && l.startsWith('{') ? JSON.parse(l) as Label : l),
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

  const [open = [], closed = []] = issues.reduce((acc, issue) => {
    if (issue.state === 'open') {
      acc[0]!.push(issue)
    }
    else if (issue.state === 'closed') {
      acc[1]!.push(issue)
    }
    return acc
  }, [[], []] as Array<Array<Pick<IssueMetadata, Exclude<IssueKeys, 'labels'>> & { score: number, labels?: Array<{ name: string, color?: string }> }>>)

  return [...open, ...closed].slice(0, 10)
}, {
  swr: true,
  getKey(event) {
    const { owner, repo, number } = getRouterParams(event)
    return `v${2 + currentIndexVersion}:issue:${owner}:${repo}:${number}`.toLowerCase()
  },
})
