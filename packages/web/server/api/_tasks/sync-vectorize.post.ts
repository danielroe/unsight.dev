import { storageKeyForIssue } from '#server/utils/embeddings'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.adminSecret || getHeader(event, 'authorization') !== `Bearer ${config.adminSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const vectorize = event.context.cloudflare?.env?.VECTORIZE_ISSUES
  if (!vectorize) {
    throw createError({ statusCode: 500, message: 'Vectorize binding not available' })
  }

  const body = await readBody(event).catch(() => ({})) || {} as Record<string, unknown>
  const filterRepos = body.repos as string[] | undefined

  const drizzle = useDrizzle()

  // Get repos to sync
  const repoQuery = drizzle
    .select({
      repoId: tables.repos.id,
      fullName: tables.repos.full_name,
    })
    .from(tables.repos)

  const repos = filterRepos?.length
    ? await repoQuery.where(inArray(tables.repos.full_name, filterRepos.map(r => r.toLowerCase()))).all()
    : await repoQuery.all()

  let totalSynced = 0
  const results: Array<{ repo: string, synced: number }> = []

  for (const repo of repos) {
    const [owner, name] = repo.fullName.split('/')
    if (!owner || !name)
      continue

    const dbIssues = await drizzle
      .select({
        number: tables.issues.number,
        embeddings: tables.issues.embeddings,
        metadata: tables.issues.metadata,
      })
      .from(tables.issues)
      .where(eq(tables.issues.repoId, repo.repoId))
      .all()

    if (!dbIssues.length)
      continue

    let repoSynced = 0
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

      await vectorize.upsert(vectors)
      repoSynced += batch.length
    }

    totalSynced += repoSynced
    results.push({ repo: repo.fullName, synced: repoSynced })
    console.log(`Synced ${repo.fullName}: ${repoSynced} vectors`)
  }

  return {
    totalSynced,
    repos: results,
  }
})
