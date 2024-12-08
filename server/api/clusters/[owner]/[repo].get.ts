import { clusterEmbeddings } from '../../../utils/cluster'
import { getEmbeddingsForIssue } from '../../../utils/embeddings'

import { isAllowedRepo, type AllowedRepo } from '#shared/repos'

const linkedRepos: Record<string, AllowedRepo[]> = {
  'danielroe/beasties': ['GoogleChromeLabs/critters'],
  'nitrojs/nitro': ['unjs/h3', 'unjs/c12', 'unjs/unenv', 'unjs/ofetch'],
  'vitejs/vite': ['rollup/rollup'],
  'nuxt/nuxt': ['nitrojs/nitro', 'unjs/h3', 'unjs/c12', 'unjs/unenv', 'unjs/ofetch'],
}

export default defineCachedEventHandler(async (event) => {
  const { owner, repo } = getRouterParams(event)
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
  return clusters
    .filter(cluster => cluster.some(issue => issue.repository?.owner?.name === owner && issue.repository?.name === repo))
    .map(cluster => cluster.map(i => ({
      html_url: i.html_url,
      state: i.state,
      pull_request: i.pull_request,
      title: i.title,
      repository: i.repository ? i.repository?.owner.name + '/' + i.repository?.name : undefined,
      updated_at: i.updated_at,
      avgSimilarity: i.avgSimilarity,
      labels: i.labels.map(l => typeof l === 'string' ? l : { name: l.name, color: l.color }),
    })))
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
