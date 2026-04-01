import { indexRepos } from '#server/utils/index-repos'
import { Octokit } from '@octokit/rest'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.adminSecret || getHeader(event, 'authorization') !== `Bearer ${config.adminSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Task name required' })
  }

  const body = await readBody(event).catch(() => ({})) || {} as Record<string, unknown>

  try {
    if (name === 'index-repo') {
      const octokit = new Octokit({ auth: config.github.token })
      return await indexRepos(octokit, {
        filter: body.filter as string[] | undefined,
        timeBudgetMs: typeof body.timeBudgetMs === 'number' ? body.timeBudgetMs : undefined,
      })
    }

    const result = await runTask(name, {
      payload: {
        ...body,
        _context: { github: config.github },
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
