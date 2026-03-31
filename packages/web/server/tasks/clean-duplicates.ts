import { count, sql } from 'drizzle-orm'
import { defineTask } from 'nitropack/runtime'
import { storageKeyForIssue } from '~~/server/utils/embeddings'

export interface TaskPayload {
  /**
   * Only clean duplicates for specific repos (e.g. ["nuxt/nuxt"])
   */
  repos?: string[]
  /**
   * Also reconcile Vectorize: remove orphan vectors and re-upsert DB records.
   * Default: false (DB-only cleanup)
   */
  syncVectorize?: boolean
}

interface RepoCleanupResult {
  repo: string
  dbDuplicatesRemoved: number
  vectorizeOrphansRemoved: number
  vectorizeResynced: number
}

export default defineTask({
  meta: {
    name: 'clean-duplicates',
    description: 'Remove duplicate issue rows and optionally reconcile Vectorize',
  },
  async run(ctx) {
    const payload = (ctx.payload ?? {}) as unknown as TaskPayload
    const drizzle = useDrizzle()
    const vectorize = useEvent()?.context.cloudflare?.env?.VECTORIZE_ISSUES || null

    // Count total rows before cleanup
    const beforeCount = await drizzle.select({ count: count() }).from(tables.issues).get()
    const totalBefore = beforeCount?.count ?? 0

    // ----- Step 1: Remove DB duplicates -----
    // If specific repos are requested, scope the cleanup
    if (payload.repos?.length) {
      const repoRows = await drizzle
        .select({ id: tables.repos.id, fullName: tables.repos.full_name })
        .from(tables.repos)
        .where(inArray(tables.repos.full_name, payload.repos.map(r => r.toLowerCase())))
        .all()

      for (const repo of repoRows) {
        await drizzle.run(
          sql`DELETE FROM issues WHERE repo_id = ${repo.id} AND id NOT IN (
            SELECT id FROM (
              SELECT id, ROW_NUMBER() OVER (
                PARTITION BY repo_id, number
                ORDER BY mtime DESC, id DESC
              ) AS rn
              FROM issues
              WHERE repo_id = ${repo.id}
            ) WHERE rn = 1
          )`,
        )
      }
    }
    else {
      // Global cleanup across all repos
      await drizzle.run(
        sql`DELETE FROM issues WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, ROW_NUMBER() OVER (
              PARTITION BY repo_id, number
              ORDER BY mtime DESC, id DESC
            ) AS rn
            FROM issues
          ) WHERE rn = 1
        )`,
      )
    }

    const afterCount = await drizzle.select({ count: count() }).from(tables.issues).get()
    const totalAfter = afterCount?.count ?? 0
    const dbRemoved = totalBefore - totalAfter

    // ----- Step 2: Per-repo stats -----
    const repoStats = await drizzle
      .select({
        repoId: tables.issues.repoId,
        fullName: tables.repos.full_name,
        count: count(),
      })
      .from(tables.issues)
      .innerJoin(tables.repos, eq(tables.issues.repoId, tables.repos.id))
      .groupBy(tables.issues.repoId)
      .all()

    const perRepoResults: RepoCleanupResult[] = repoStats.map(r => ({
      repo: r.fullName,
      dbDuplicatesRemoved: 0, // We can't attribute per-repo from the bulk delete
      vectorizeOrphansRemoved: 0,
      vectorizeResynced: 0,
    }))

    // ----- Step 3: Vectorize reconciliation (if requested) -----
    if (payload.syncVectorize && vectorize) {
      for (const stat of repoStats) {
        const [owner, name] = stat.fullName.split('/')
        if (!owner || !name)
          continue

        const repoResult = perRepoResults.find(r => r.repo === stat.fullName)

        // Get all issue numbers in the DB for this repo
        const dbIssues = await drizzle
          .select({
            number: tables.issues.number,
            embeddings: tables.issues.embeddings,
            metadata: tables.issues.metadata,
          })
          .from(tables.issues)
          .where(eq(tables.issues.repoId, stat.repoId))
          .all()

        // Re-upsert all DB issues to Vectorize to ensure consistency
        // Vectorize doesn't support prefix listing, so we check each DB issue
        // and re-upsert to ensure consistency
        for (let i = 0; i < dbIssues.length; i += 100) {
          const batch = dbIssues.slice(i, i + 100)
          const vectors = batch.map((issue) => {
            const metadata = JSON.parse(issue.metadata) as Record<string, unknown>
            return {
              id: storageKeyForIssue(owner, name, issue.number),
              values: JSON.parse(issue.embeddings) as number[],
              metadata: { ...metadata, labels: JSON.stringify(metadata.labels) },
            }
          })

          try {
            await vectorize.upsert(vectors)
            if (repoResult) {
              repoResult.vectorizeResynced += batch.length
            }
          }
          catch (e) {
            console.error(`Failed to upsert Vectorize batch for ${stat.fullName}:`, e)
          }
        }

        console.log(`Reconciled ${stat.fullName}: ${dbIssues.length} issues synced to Vectorize`)
      }
    }

    const summary = [
      dbRemoved > 0
        ? `Removed ${dbRemoved} duplicate DB rows (${totalBefore} → ${totalAfter} issues).`
        : `No duplicate issues found (${totalAfter} issues total).`,
      `Repos: ${repoStats.map(r => `${r.fullName} (${r.count})`).join(', ')}.`,
    ]

    if (payload.syncVectorize) {
      const totalResynced = perRepoResults.reduce((sum, r) => sum + r.vectorizeResynced, 0)
      summary.push(`Vectorize: ${totalResynced} vectors resynced.`)
    }

    return {
      result: summary.join(' '),
      details: {
        dbDuplicatesRemoved: dbRemoved,
        totalBefore,
        totalAfter,
        repos: perRepoResults,
      },
    }
  },
})
