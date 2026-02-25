export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.adminSecret || getHeader(event, 'authorization') !== `Bearer ${config.adminSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Task name required' })
  }

  const body = await readBody(event).catch(() => ({}))

  try {
    // Pass runtime config context so tasks can access secrets on Cloudflare Workers
    const result = await runTask(name, {
      payload: {
        ...body,
        _context: {
          github: config.github,
        },
      },
    })
    return result
  }
  catch (error) {
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Task failed',
      data: { task: name, error: String(error) },
    })
  }
})
