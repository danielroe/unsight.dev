export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const { id } = getRouterParams(event)

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
    throw createError({ statusCode: 403, message: 'Not authorized to delete this dashboard' })
  }

  // dashboard_repos will be cascade deleted
  await drizzle.delete(tables.dashboards).where(eq(tables.dashboards.id, id))

  return { success: true }
})
