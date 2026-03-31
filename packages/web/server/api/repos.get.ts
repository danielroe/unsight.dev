import { count } from 'drizzle-orm'
import { randomUUID } from 'uncrypto'
import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'

const invalidateKeys = new Set<string>()

export default defineCachedCorsEventHandler(async () => {
  const drizzle = useDrizzle()

  const [repos, issueCounts] = await Promise.all([
    drizzle.select().from(tables.repos),
    drizzle
      .select({
        repoId: tables.issues.repoId,
        count: count(),
      })
      .from(tables.issues)
      .groupBy(tables.issues.repoId),
  ])

  const issueCountMap = new Map(
    issueCounts.map(item => [item.repoId, item.count]),
  )

  return repos.map(repo => ({
    repo: repo.full_name,
    issuesIndexed: issueCountMap.get(repo.id) || 0,
    indexed: repo.indexed === currentIndexVersion,
    indexingInProgress: repo.indexCursor > 0,
  }))
}, {
  swr: true,
  maxAge: 60 * 60 * 24,
  staleMaxAge: 60 * 60 * 24,
  shouldBypassCache: () => !!import.meta.dev,
  shouldInvalidateCache: (event) => {
    const key = getHeaders(event).invalidate
    return !!key && invalidateKeys.delete(key)
  },
  getKey() {
    return `v1:repos`
  },
})

export async function invalidateRepos() {
  const key = randomUUID()
  invalidateKeys.add(key)
  await $fetch('/api/repos', {
    headers: {
      invalidate: key,
    },
  })
}
