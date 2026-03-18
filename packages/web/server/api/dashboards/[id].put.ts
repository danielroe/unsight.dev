import { inArray } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'Dashboard ID is required' })
  }

  const drizzle = useDrizzle()

  // Verify ownership
  const dashboard = await drizzle
    .select()
    .from(tables.dashboards)
    .where(eq(tables.dashboards.id, id))
    .get()

  if (!dashboard) {
    throw createError({ statusCode: 404, message: 'Dashboard not found' })
  }
  if (dashboard.githubId !== session.user.githubId) {
    throw createError({ statusCode: 403, message: 'Not authorized to edit this dashboard' })
  }

  const body = await readBody<{ name?: string, repos?: string[] }>(event)

  // Update name if provided
  if (body.name?.trim()) {
    const slug = slugify(body.name)

    // Check slug uniqueness (excluding current dashboard)
    const existing = await drizzle
      .select({ id: tables.dashboards.id })
      .from(tables.dashboards)
      .where(and(
        eq(tables.dashboards.githubId, session.user.githubId),
        eq(tables.dashboards.slug, slug),
      ))
      .get()

    if (existing && existing.id !== id) {
      throw createError({ statusCode: 409, message: 'A dashboard with this name already exists' })
    }

    await drizzle.update(tables.dashboards).set({
      name: body.name.trim(),
      slug,
    }).where(eq(tables.dashboards.id, id))
  }

  // Update repos if provided
  if (body.repos) {
    if (!body.repos.length) {
      throw createError({ statusCode: 400, message: 'At least one repository is required' })
    }

    const repoRecords = await drizzle
      .select({ id: tables.repos.id })
      .from(tables.repos)
      .where(inArray(tables.repos.full_name, body.repos.map(r => r.toLowerCase())))

    if (!repoRecords.length) {
      throw createError({ statusCode: 400, message: 'None of the specified repositories are indexed' })
    }

    // Replace all repo associations
    await drizzle.delete(tables.dashboardRepos).where(eq(tables.dashboardRepos.dashboardId, id))
    await drizzle.insert(tables.dashboardRepos).values(
      repoRecords.map(r => ({
        dashboardId: id,
        repoId: r.id,
      })),
    )
  }

  return { success: true }
})
