import { count, sql } from 'drizzle-orm'
import { defineTask } from 'nitropack/runtime'

export interface TaskPayload {
  /**
   * Only validate specific repos (e.g. ["nuxt/nuxt"])
   */
  repos?: string[]
}

interface RepoDiagnostics {
  repo: string
  totalIssues: number
  duplicateGroups: number
  duplicateRows: number
  /** Issues stored in DB that may not be in Vectorize (based on count mismatch) */
  staleIndexCursor: number
  indexed: boolean
}

export default defineTask({
  meta: {
    name: 'validate-index',
    description: 'Diagnose duplicate issues and index integrity problems without modifying data',
  },
  async run(ctx) {
    const payload = (ctx.payload ?? {}) as unknown as TaskPayload
    const drizzle = useDrizzle()

    // Get all repos or filter to requested ones
    let repoFilter = drizzle.select().from(tables.repos)
    if (payload.repos?.length) {
      repoFilter = repoFilter.where(
        inArray(tables.repos.full_name, payload.repos.map(r => r.toLowerCase())),
      ) as typeof repoFilter
    }
    const repos = await repoFilter.all()

    const diagnostics: RepoDiagnostics[] = []
    let totalDuplicateRows = 0

    for (const repo of repos) {
      // Count total issues
      const totalResult = await drizzle
        .select({ count: count() })
        .from(tables.issues)
        .where(eq(tables.issues.repoId, repo.id))
        .get()
      const totalIssues = totalResult?.count ?? 0

      // Find duplicate (repo_id, number) groups
      const dupeResult = await drizzle.all(
        sql`SELECT number, COUNT(*) as cnt
            FROM issues
            WHERE repo_id = ${repo.id}
            GROUP BY repo_id, number
            HAVING COUNT(*) > 1`,
      ) as { number: number, cnt: number }[]

      const duplicateGroups = dupeResult.length
      const duplicateRows = dupeResult.reduce((sum, r) => sum + (r.cnt - 1), 0)
      totalDuplicateRows += duplicateRows

      diagnostics.push({
        repo: repo.full_name,
        totalIssues,
        duplicateGroups,
        duplicateRows,
        staleIndexCursor: repo.indexCursor,
        indexed: repo.indexed > 0,
      })

      if (duplicateGroups > 0) {
        // Log the first few duplicate groups for debugging
        const sample = dupeResult.slice(0, 10)
        console.log(
          `${repo.full_name}: ${duplicateGroups} duplicate groups (${duplicateRows} extra rows). `
          + `Sample issue numbers: ${sample.map(d => `#${d.number} (${d.cnt}x)`).join(', ')}`,
        )
      }
    }

    // Overall stats
    const totalIssuesResult = await drizzle.select({ count: count() }).from(tables.issues).get()
    const totalIssues = totalIssuesResult?.count ?? 0

    const reposWithDupes = diagnostics.filter(d => d.duplicateRows > 0)
    const reposWithStaleCursor = diagnostics.filter(d => d.staleIndexCursor > 0)
    const reposNotIndexed = diagnostics.filter(d => !d.indexed)

    const summary = [
      `Validated ${diagnostics.length} repos, ${totalIssues} total issue rows.`,
      totalDuplicateRows > 0
        ? `Found ${totalDuplicateRows} duplicate rows across ${reposWithDupes.length} repos: ${reposWithDupes.map(r => `${r.repo} (${r.duplicateRows} dupes in ${r.duplicateGroups} issues)`).join(', ')}.`
        : 'No duplicate rows found.',
      reposWithStaleCursor.length > 0
        ? `${reposWithStaleCursor.length} repos have a non-zero index cursor (partially indexed): ${reposWithStaleCursor.map(r => `${r.repo} (page ${r.staleIndexCursor})`).join(', ')}.`
        : 'All repos have completed indexing.',
      reposNotIndexed.length > 0
        ? `${reposNotIndexed.length} repos are not yet indexed: ${reposNotIndexed.map(r => r.repo).join(', ')}.`
        : '',
    ].filter(Boolean)

    return {
      result: summary.join(' '),
      diagnostics,
    }
  },
})
