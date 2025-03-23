import { count, eq } from 'drizzle-orm'
import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'

export default defineCachedCorsEventHandler(async () => {
  const drizzle = useDrizzle()

  const repos = await drizzle.select().from(tables.repos).all()

  return Promise.all(repos.map(async repo => ({
    repo: repo.full_name,
    issuesIndexed: await drizzle.select({ count: count() }).from(tables.issues).where(eq(tables.issues.repoId, repo.id)).then(([r]) => r!.count),
    indexed: repo.indexed === currentIndexVersion,
  })))
}, { swr: true, shouldBypassCache: () => !!import.meta.dev })
