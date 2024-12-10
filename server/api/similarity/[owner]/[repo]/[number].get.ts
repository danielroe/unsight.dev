import { getStoredMetadataForIssue, storageKeyForIssue, type IssueMetadata } from '~~/server/utils/embeddings'

export default defineEventHandler(async (event) => {
  const handled = handleCors(event, {
    methods: ['GET', 'OPTIONS', 'HEAD'],
    preflight: {
      statusCode: 204,
    },
    origin: [import.meta.dev ? 'http://localhost:3000' : 'https://unsight.dev', 'https://github.com'],
  })

  if (handled || event.method !== 'GET') {
    return
  }

  return issueHandler(event)
})

const issueHandler = defineCachedEventHandler(async (event) => {
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
  const results = issueVector?.[0] ? await vectorize?.query(issueVector[0].values) : undefined

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
