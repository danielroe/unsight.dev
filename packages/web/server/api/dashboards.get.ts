export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Not authenticated' })
  }

  const drizzle = useDrizzle()

  const userDashboards = await drizzle
    .select()
    .from(tables.dashboards)
    .where(eq(tables.dashboards.githubId, session.user.githubId))

  return userDashboards
})
