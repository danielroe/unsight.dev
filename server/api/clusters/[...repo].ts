import { clusterEmbeddings } from '../../utils/cluster'
import { getEmbeddingsForIssue } from '../../utils/embeddings'
import type { Issue } from '../../utils/github'

const linkedRepos: Record<string, string[]> = {
  'danielroe/beasties': ['GoogleChromeLabs/critters'],
  'nuxt/nuxt': ['vuejs/core', 'vitejs/vite', 'nitrojs/nitro'],
}

const allowedRepos = ['nuxt/nuxt', 'vuejs/vue', 'vitejs/vite', 'nitrojs/nitro', 'danielroe/beasties']

export default defineCachedEventHandler(async (event) => {
  const [owner, repo] = getRouterParam(event, 'repo')?.split('/') || []
  if (!owner || !repo) {
    throw createError({
      status: 400,
      message: 'Invalid repository',
    })
  }

  const source = `${owner}/${repo}`

  if (!allowedRepos.includes(source)) {
    throw createError({
      status: 400,
      message: 'Repository not allowed',
    })
  }

  const repos = [source, ...linkedRepos[source] || []]
  const issues = await Promise.all(repos.map(async repo => event.$fetch<Issue[]>(`/api/issues/${repo}`)))
    .then(r => r.flat())

  console.log('fetched', issues.length, 'issues')

  const embeddings: number[][] = []

  do {
    const batch = issues.splice(0, 100)
    embeddings.push(...await Promise.all(batch.map(async issue => getEmbeddingsForIssue(event, issue))))
  } while (issues.length)

  const clusters = clusterEmbeddings(issues, embeddings)
  return clusters.filter((cluster) => {
    return cluster.some(issue => issue.repository?.owner?.name === owner && issue.repository?.name === repo)
  })
}, {
  swr: true,
  getKey(event) {
    const [owner, repo] = getRouterParam(event, 'repo')?.split('/') || []
    return `clusters:${owner}:${repo}`
  },
  maxAge: 60 * 60 * 1000,
  staleMaxAge: 60 * 60 * 1000,
  shouldBypassCache: event => getHeader(event, 'force') === 'true',
})
