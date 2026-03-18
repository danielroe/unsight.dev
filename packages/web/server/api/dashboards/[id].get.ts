export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event)
  if (!id) {
    throw createError({ statusCode: 400, message: 'Dashboard ID is required' })
  }

  const dashboard = await getDashboardWithRepos(id)
  if (!dashboard) {
    throw createError({ statusCode: 404, message: 'Dashboard not found' })
  }

  return dashboard
})
