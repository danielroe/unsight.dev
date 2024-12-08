import { Octokit } from '@octokit/rest'

import { isAllowedRepo } from '#shared/repos'
import { getEmbeddingsForIssue, getStoredEmbeddingsForIssue } from '~~/server/utils/embeddings'

export default defineEventHandler(async (event) => {
  const handled = handleCors(event, {
    methods: ['GET', 'OPTIONS', 'HEAD'],
    preflight: {
      statusCode: 204,
    },
    origin: [import.meta.dev ? 'http://localhost:3000' : 'https://unsight.dev', 'https://github.com'],
  })

  console.log({ handled, method: event.method })
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

  const source = `${owner}/${repo}`

  if (!isAllowedRepo(source)) {
    throw createError({
      status: 400,
      message: 'Repository not allowed',
    })
  }

  const vectorize = typeof hubVectorize !== 'undefined' ? hubVectorize('issues') : null

  let issueEmbeddings = await getStoredEmbeddingsForIssue(event, owner, repo, number)
  if (!issueEmbeddings) {
    const options = owner !== 'unjs' ? { auth: useRuntimeConfig(event).github.token } : {}
    const octokit = new Octokit(options)

    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: parseInt(number),
    })

    issueEmbeddings = await getEmbeddingsForIssue(event, issue)
  }

  const results = await vectorize?.query(issueEmbeddings, {
    // TODO: support similar repos
    // filter: {
    //   owner,
    //   repository: repo,
    // },
  })

  return results?.matches.map((m) => {
    const groups = m.id.match(/^issue:(?<owner>[^:]+):(?<repo>[^:]+):(?<number>\d+)$/)?.groups
    if (!groups) {
      console.error('Invalid match', m.id)
      return
    }
    return {
      owner: groups.owner,
      repo: groups.repo,
      number: parseInt(groups.number!),
      score: m.score,
    }
  }).filter(Boolean)
}, {
  swr: true,
  getKey(event) {
    const { owner, repo, number } = getRouterParams(event)
    return `issue:${owner}:${repo}:${number}`.toLowerCase()
  },
  maxAge: 60 * 60 * 1000,
  staleMaxAge: 60 * 60 * 1000,
  shouldBypassCache: event => getHeader(event, 'force') === 'true',
  shouldInvalidateCache: event => getHeader(event, 'force') === 'true',
})
