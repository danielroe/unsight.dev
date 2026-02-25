export default defineEventHandler(async (event) => {
  const secret = useRuntimeConfig(event).adminSecret
  if (!secret || getHeader(event, 'authorization') !== `Bearer ${secret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Task name required' })
  }

  const body = await readBody(event).catch(() => ({}))
  const result = await runTask(name, { payload: body || {} })

  return result
})
