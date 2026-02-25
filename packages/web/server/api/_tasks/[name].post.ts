import { Octokit } from '@octokit/rest'
import { indexRepo } from '~~/server/routes/github/webhook.post'
import { currentIndexVersion, getMetadataForRepo } from '~~/server/utils/metadata'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  if (!config.adminSecret || getHeader(event, 'authorization') !== `Bearer ${config.adminSecret}`) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Task name required' })
  }

  const body = await readBody(event).catch(() => ({})) as Record<string, unknown>

  try {
    if (name === 'index-repo') {
      return await indexRepoHandler(config.github, body)
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

async function indexRepoHandler(github: { token: string }, body: Record<string, unknown>) {
  const octokit = new Octokit({ auth: github.token })
  const filter = body.filter as string[] | undefined

  const repos = await $fetch('/api/repos')
  const indexed: string[] = []
  let count = 1

  for (const repo of repos as { repo: string, indexed: boolean }[]) {
    if (repo.indexed || (filter && !filter.includes(repo.repo)))
      continue

    try {
      const [owner, name] = repo.repo.split('/')
      const meta = await getMetadataForRepo(owner!, name!)
      if (!meta)
        continue

      await indexRepo(octokit, meta)
      await useDrizzle().update(tables.repos).set({ indexed: currentIndexVersion }).where(eq(tables.repos.id, meta.id))
      indexed.push(repo.repo)
    }
    catch (e) {
      console.error('Error indexing', repo.repo, e)
    }

    if (count++ > 30)
      break
  }

  return { result: `Indexed repositories (${indexed.join(', ')}).` }
}
