import { count } from 'drizzle-orm'
import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'

export default defineCachedCorsEventHandler(async () => {
  const drizzle = useDrizzle()

  const [repos, issueCounts] = await Promise.all([
    drizzle.select().from(tables.repos).all(),
    drizzle
      .select({
        repoId: tables.issues.repoId,
        count: count(),
      })
      .from(tables.issues)
      .groupBy(tables.issues.repoId)
      .all(),
  ])

  const issueCountMap = new Map(
    issueCounts.map(item => [item.repoId, item.count]),
  )

  return repos.map(repo => ({
    repo: repo.full_name,
    issuesIndexed: issueCountMap.get(repo.id) || 0,
    indexed: repo.indexed === currentIndexVersion,
  }))
}, { swr: true, shouldBypassCache: () => !!import.meta.dev })
