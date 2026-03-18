import { count, inArray } from 'drizzle-orm'
import { randomUUID } from 'uncrypto'

export function generateDashboardId() {
  return randomUUID()
}

const SLUGIFY_STRIP_RE = /[^\w\s-]/g
const SLUGIFY_SPACES_RE = /\s+/g
const SLUGIFY_DASHES_RE = /-+/g
const SLUGIFY_TRIM_RE = /^-|-$/g

export function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(SLUGIFY_STRIP_RE, '')
    .replace(SLUGIFY_SPACES_RE, '-')
    .replace(SLUGIFY_DASHES_RE, '-')
    .replace(SLUGIFY_TRIM_RE, '')
}

export async function getDashboardWithRepos(dashboardId: string) {
  const drizzle = useDrizzle()

  const dashboard = await drizzle
    .select()
    .from(tables.dashboards)
    .where(eq(tables.dashboards.id, dashboardId))
    .get()

  if (!dashboard) {
    return null
  }

  const repoLinks = await drizzle
    .select({
      repoId: tables.dashboardRepos.repoId,
      fullName: tables.repos.full_name,
      indexed: tables.repos.indexed,
    })
    .from(tables.dashboardRepos)
    .innerJoin(tables.repos, eq(tables.dashboardRepos.repoId, tables.repos.id))
    .where(eq(tables.dashboardRepos.dashboardId, dashboardId))

  // Get issue counts for each repo in the dashboard
  const repoIds = repoLinks.map(r => r.repoId)
  const issueCounts = repoIds.length
    ? await drizzle
        .select({
          repoId: tables.issues.repoId,
          count: count(),
        })
        .from(tables.issues)
        .where(inArray(tables.issues.repoId, repoIds))
        .groupBy(tables.issues.repoId)
    : []

  const issueCountMap = new Map(issueCounts.map(item => [item.repoId, item.count]))

  return {
    ...dashboard,
    repos: repoLinks.map(r => ({
      repoId: r.repoId,
      fullName: r.fullName,
      indexed: r.indexed === currentIndexVersion,
      issuesIndexed: issueCountMap.get(r.repoId) || 0,
    })),
  }
}

export async function getDashboardRepoIds(dashboardId: string): Promise<number[]> {
  const repoLinks = await useDrizzle()
    .select({ repoId: tables.dashboardRepos.repoId })
    .from(tables.dashboardRepos)
    .where(eq(tables.dashboardRepos.dashboardId, dashboardId))

  return repoLinks.map(r => r.repoId)
}
