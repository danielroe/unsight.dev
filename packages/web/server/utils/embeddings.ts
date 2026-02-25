import type { RestEndpointMethodTypes } from '@octokit/rest'
import type { Issue } from '@octokit/webhooks-types'
import { hash } from 'ohash'
import { invalidateCluster } from '~~/server/api/clusters/[owner]/[repo].get'

type RestIssue = RestEndpointMethodTypes['issues']['get']['response']['data']

export type IssueSegments = 'labels' | 'title' | 'body'

// Cache for repository IDs to avoid repeated lookups
const repoIdCache = new Map<string, number | null>()

// Function to get repository ID with caching
async function getRepoId(owner: string, repo: string): Promise<number | null> {
  const cacheKey = `${owner}/${repo}`.toLowerCase()

  // Check cache first
  if (repoIdCache.has(cacheKey)) {
    return repoIdCache.get(cacheKey) as number | null
  }

  // Query database if not in cache
  const result = await useDrizzle()
    .select({ repoId: tables.repos.id })
    .from(tables.repos)
    .where(eq(tables.repos.full_name, cacheKey))
    .get()

  const repoId = result?.repoId ?? null
  repoIdCache.set(cacheKey, repoId)
  return repoId
}

export function storageKeyForIssue(owner: string, repo: string, number: number | string) {
  return `issue:${owner}:${repo}:${number}`
}

export function storagePrefixForRepo(owner: string, repo: string) {
  return `issue:${owner}:${repo}:`
}

export async function getStoredEmbeddingsForRepo(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
  const repoId = await getRepoId(owner, repo)
  if (!repoId) {
    return []
  }

  const issues = await useDrizzle().select().from(tables.issues).where(
    state === 'all'
      ? eq(tables.issues.repoId, repoId)
      : and(eq(tables.issues.repoId, repoId), eq(tables.issues.state, state)),
  ).all()

  return issues.map(i => ({
    ...i,
    metadata: JSON.parse(i.metadata) as IssueMetadata,
    embeddings: JSON.parse(i.embeddings) as number[],
  }))
}

export async function removeStoredEmbeddingsForRepo(owner: string, repo: string) {
  const repoId = await getRepoId(owner, repo)
  if (!repoId) {
    return
  }

  const vectorize = useEvent()?.context.cloudflare?.env?.VECTORIZE_ISSUES || null
  if (vectorize) {
    const issues = await useDrizzle()
      .select({ number: tables.issues.number })
      .from(tables.issues)
      .where(eq(tables.issues.repoId, repoId))
      .all()
    const vectorIds = issues.map(i => storageKeyForIssue(owner, repo, i.number))
    // Vectorize deleteByIds supports up to 1000 IDs per call
    for (let i = 0; i < vectorIds.length; i += 1000) {
      await vectorize.deleteByIds(vectorIds.slice(i, i + 1000))
    }
  }

  const result = await useDrizzle().delete(tables.issues).where(eq(tables.issues.repoId, repoId))
  console.log('removed stored embeddings for repo:', owner, repo, result)
}

export async function removeIssue(issue: Pick<Issue, 'number'>, repo: { owner: { login: string }, name: string }) {
  const repoId = await getRepoId(repo.owner.login, repo.name)
  if (!repoId) {
    return
  }
  const vectorize = useEvent()?.context.cloudflare?.env?.VECTORIZE_ISSUES || null
  await Promise.all([
    useDrizzle().delete(tables.issues).where(
      and(eq(tables.issues.repoId, repoId), eq(tables.issues.number, issue.number)),
    ),
    vectorize?.deleteByIds([storageKeyForIssue(repo.owner.login, repo.name, issue.number)]),
  ])
  console.log('removed issue:', repo.owner.login, repo.name, issue.number)
}

const knownBots = new Set(['renovate', 'renovate[bot]'])
export async function indexIssue(issue: Issue | RestIssue, repo: { owner: { login: string }, name: string }) {
  if (issue.user && (knownBots.has(issue.user.login) || issue.user.login.endsWith('[bot]'))) {
    return
  }
  if (issue.pull_request) {
    return
  }
  const repoId = await getRepoId(repo.owner.login, repo.name)
  if (!repoId) {
    console.error('repo not found:', repo.owner.login, repo.name)
    return
  }

  const vectorize = useEvent()!.context.cloudflare?.env?.VECTORIZE_ISSUES || null

  const issueUpdatedTime = new Date(issue.updated_at).getTime()

  const text = chunkIssue(issue)
  const issueHash = hash(text)

  const issueMetadata: IssueMetadata = {
    owner: repo.owner.login,
    repository: repo.name,
    number: issue.number,
    description: issue.body || '',
    title: issue.title,
    url: issue.html_url,
    updated_at: issue.updated_at,
    labels: issue.labels?.map(label => (typeof label === 'string' ? label : { name: label.name!, color: label.color || undefined })) || [],
    state: issue.state || 'open',
  }

  const drizzle = useDrizzle()
  // Use both repoId and number to narrow the query
  const res = await drizzle.select().from(tables.issues).where(and(
    eq(tables.issues.repoId, repoId),
    eq(tables.issues.number, issue.number),
  )).get()

  if (res && (res.mtime >= issueUpdatedTime || res.hash === issueHash)) {
    return await Promise.all([
      vectorize?.upsert([{
        id: storageKeyForIssue(repo.owner.login, repo.name, issue.number),
        values: JSON.parse(res.embeddings) as number[],
        metadata: { ...issueMetadata, labels: JSON.stringify(issueMetadata.labels) },
      }]),
      drizzle.update(tables.issues).set({
        title: issue.title,
        state: issue.state,
        metadata: JSON.stringify(issueMetadata),
        mtime: issueUpdatedTime,
      }).where(eq(tables.issues.id, res.id)).execute(),
    ])
  }

  const embeddings = await generateEmbedding(text)
  if (!embeddings.length) {
    console.warn('failed to generate embedding for issue:', repo.owner.login, repo.name, issue.number)
    return
  }

  const updatedValues = {
    repoId,
    hash: issueHash,
    title: issue.title,
    state: issue.state || 'open',
    number: issue.number,
    metadata: JSON.stringify(issueMetadata),
    mtime: issueUpdatedTime,
    embeddings: JSON.stringify(embeddings),
  }

  await Promise.all([
    vectorize?.upsert([{
      id: storageKeyForIssue(repo.owner.login, repo.name, issue.number),
      values: embeddings,
      metadata: { ...issueMetadata, labels: JSON.stringify(issueMetadata.labels) },
    }]),
    res
      ? drizzle.update(tables.issues).set(updatedValues).where(eq(tables.issues.id, res.id)).execute()
      : drizzle.insert(tables.issues).values(updatedValues).execute(),
  ])

  // invalidate clusters for this repo
  await invalidateCluster(repo.owner.login, repo.name)

  console.log('indexed issue:', issueMetadata)

  return embeddings
}

// Clear the repo ID cache when repos are updated
export function clearRepoIdCache(owner?: string, repo?: string) {
  if (owner && repo) {
    repoIdCache.delete(`${owner}/${repo}`.toLowerCase())
  }
  else {
    repoIdCache.clear()
  }
}

export type Label = string | { name: string, color?: string }

export interface IssueMetadata {
  owner: string
  repository: string
  description: string
  number: number
  title: string
  url: string
  updated_at: string
  labels: Label[]
  state: string
}

export type IssueKeys = 'owner' | 'repository' | 'number' | 'title' | 'url' | 'updated_at' | 'labels' | 'state'

export interface StoredEmbeddings {
  mtime: number
  hash: string
  metadata: IssueMetadata
  embeddings: number[]
}

function preprocessText(text: string): string {
  return text
    .toLowerCase()
    .replace(/### (Environment|Reproduction).*### /, '### ')
    .replace(/### \w+\s+_No response_/, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

export function chunkIssue(issue: Pick<Issue | RestIssue, IssueSegments>, exclude?: Set<string>) {
  const labels = getLabels(issue).filter(l => !exclude?.has(l))
  return preprocessText(`${issue.title}\n${labels.join(', ')}\n${issue.body}`)
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const ai = useEvent()!.context.cloudflare.env.AI
    const res = await ai.run('@cf/baai/bge-large-en-v1.5', { text })
    return (res as { data?: number[][] }).data?.[0] || []
  }
  catch {
    return []
  }
}

function getLabels(issue: Pick<Issue | RestIssue, IssueSegments>) {
  return issue.labels?.map(label => (typeof label === 'string' ? label : label.name!).toLowerCase()).filter(Boolean) || []
}
