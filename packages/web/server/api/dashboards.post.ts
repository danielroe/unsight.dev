import { inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const body = await readBody<{ name: string, repos: string[] }>(event)
  if (!body.name?.trim()) {
    throw createError({ statusCode: 400, message: 'Dashboard name is required' })
  }
  if (!body.repos?.length) {
    throw createError({ statusCode: 400, message: 'At least one repository is required' })
  }

  const drizzle = useDrizzle()
  const slug = slugify(body.name)

  // Check for slug uniqueness within this user's dashboards
  const existing = await drizzle
    .select({ id: tables.dashboards.id })
    .from(tables.dashboards)
    .where(and(
      eq(tables.dashboards.githubId, session.user.githubId),
      eq(tables.dashboards.slug, slug),
    ))
    .get()

  if (existing) {
    throw createError({ statusCode: 409, message: 'A dashboard with this name already exists' })
  }

  // Resolve repo full_names to repo IDs
  const repoRecords = await drizzle
    .select({ id: tables.repos.id, fullName: tables.repos.full_name })
    .from(tables.repos)
    .where(inArray(tables.repos.full_name, body.repos.map(r => r.toLowerCase())))

  if (!repoRecords.length) {
    throw createError({ statusCode: 400, message: 'None of the specified repositories are indexed' })
  }

  const dashboardId = generateDashboardId()

  await drizzle.insert(tables.dashboards).values({
    id: dashboardId,
    slug,
    name: body.name.trim(),
    githubId: session.user.githubId,
    githubLogin: session.user.login,
    createdAt: Date.now(),
  })

  // Insert repo associations
  await drizzle.insert(tables.dashboardRepos).values(
    repoRecords.map(r => ({
      dashboardId,
      repoId: r.id,
    })),
  )

  return { id: dashboardId, slug }
})
