import { clusterEmbeddings } from '../../utils/cluster'
import { getEmbeddingsForIssue } from '../../utils/embeddings'

import { isAllowedRepo, type AllowedRepo } from '#shared/repos'

const linkedRepos: Record<string, AllowedRepo[]> = {
  'danielroe/beasties': ['GoogleChromeLabs/critters'],
  'nitrojs/nitro': ['unjs/h3', 'unjs/c12', 'unjs/unenv', 'unjs/ofetch'],
  'vitejs/vite': ['rollup/rollup'],
  'nuxt/nuxt': ['nitrojs/nitro'],
}

export default defineCachedEventHandler(async (event) => {
  const [owner, repo] = getRouterParam(event, 'repo')?.split('/') || []
  if (!owner || !repo) {
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

  const repos = [source, ...linkedRepos[source] || []]
  const issues = await Promise.all(repos.map(async repo => $fetch(`/api/issues/${repo}`)))
    .then(r => r.flat())

  console.log('fetched', issues.length, 'issues')

  const backlog = [...issues]
  const embeddings: number[][] = []

  let b = 1
  do {
    const batch = backlog.splice(0, 100)
    console.log('fetching batch', b++)
    embeddings.push(...await Promise.all(batch.map(async issue => getEmbeddingsForIssue(event, issue))))
  } while (backlog.length)

  console.log('generated', embeddings.length, 'embeddings')
  const clusters = clusterEmbeddings(issues, embeddings)
  console.log('generated', clusters.length, 'clusters')
  return clusters.filter((cluster) => {
    return cluster.some(issue => issue.repository?.owner?.name === owner && issue.repository?.name === repo)
  })
}, {
  swr: true,
  getKey(event) {
    const [owner, repo] = getRouterParam(event, 'repo')?.split('/') || []
    return `clusters:${owner}:${repo}`.toLowerCase()
  },
  maxAge: 60 * 60 * 1000,
  staleMaxAge: 60 * 60 * 1000,
  shouldBypassCache: event => getHeader(event, 'force') === 'true',
  shouldInvalidateCache: event => getHeader(event, 'force') === 'true',
})
