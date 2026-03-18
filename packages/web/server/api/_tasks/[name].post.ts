import { Octokit } from '@octokit/rest'
import { indexRepo } from '~~/server/utils/index-repo'
import { getMetadataForRepo } from '~~/server/utils/metadata'

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
  const timeBudgetMs = typeof body.timeBudgetMs === 'number' ? body.timeBudgetMs : undefined

  const repos = await $fetch('/api/repos')
  const indexed: string[] = []
  const partial: string[] = []

  // Also check for repos with a non-zero cursor (partially indexed from a previous run)
  const allRepos = await useDrizzle().select({
    fullName: tables.repos.full_name,
    indexCursor: tables.repos.indexCursor,
    indexedVersion: tables.repos.indexed,
  }).from(tables.repos).all()
  const cursorMap = new Map(allRepos.map(r => [r.fullName, r.indexCursor]))

  for (const repo of repos as { repo: string, indexed: boolean }[]) {
    const cursor = cursorMap.get(repo.repo) || 0
    const needsIndexing = !repo.indexed || cursor > 0
    if (!needsIndexing || (filter && !filter.includes(repo.repo)))
      continue

    try {
      const [owner, name] = repo.repo.split('/')
      const meta = await getMetadataForRepo(owner!, name!)
      if (!meta)
        continue

      const result = await indexRepo(octokit, meta, { timeBudgetMs })

      if (result.complete) {
        indexed.push(repo.repo)
      }
      else {
        partial.push(repo.repo)
        // Stop processing more repos — this one consumed the time budget
        break
      }
    }
    catch (e) {
      console.error('Error indexing', repo.repo, e)
    }
  }

  const parts = []
  if (indexed.length)
    parts.push(`Fully indexed: ${indexed.join(', ')}`)
  if (partial.length)
    parts.push(`Partially indexed (will resume): ${partial.join(', ')}`)
  if (!parts.length)
    parts.push('No repos needed indexing')

  return { result: `${parts.join('. ')}.` }
}
