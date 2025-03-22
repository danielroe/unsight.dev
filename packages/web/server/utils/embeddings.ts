import type { RestEndpointMethodTypes } from '@octokit/rest'
import type { Issue } from '@octokit/webhooks-types'
import { hash } from 'ohash'

type RestIssue = RestEndpointMethodTypes['issues']['get']['response']['data']

export type IssueSegments = 'labels' | 'title' | 'body'

export function storageKeyForIssue(owner: string, repo: string, number: number | string) {
  return `issue:${owner}:${repo}:${number}`
}

export function storagePrefixForRepo(owner: string, repo: string) {
  return `issue:${owner}:${repo}:`
}

export async function getStoredEmbeddingsForRepo(owner: string, repo: string, state: 'open' | 'closed' | 'all' = 'open') {
  const { repoId } = await useDrizzle().select({ repoId: tables.repos.id }).from(tables.repos).where(eq(tables.repos, `${owner}/${repo}`)).get() || {}
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
    embeddings: JSON.parse(i.embeddings) as number[],
  }))
}

export async function removeStoredEmbeddingsForRepo(owner: string, repo: string) {
  const { repoId } = await useDrizzle().select({ repoId: tables.repos.id }).from(tables.repos).where(eq(tables.repos, `${owner}/${repo}`)).get() || {}
  if (!repoId) {
    return
  }

  const result = await useDrizzle().delete(tables.issues).where(eq(tables.issues.repoId, repoId)).execute()
  console.log('removed stored embeddings for repo:', owner, repo, result)
}

export async function removeIssue(issue: Pick<Issue, 'number'>, repo: { owner: { login: string }, name: string }) {
  const { repoId } = await useDrizzle().select({ repoId: tables.repos.id }).from(tables.repos).where(eq(tables.repos, `${repo.owner.login}/${repo.name}`)).get() || {}
  if (!repoId) {
    return
  }
  await useDrizzle().delete(tables.issues).where(
    and(eq(tables.issues.repoId, repoId), eq(tables.issues.number, issue.number)),
  ).execute()
  console.log('removed issue:', repo.owner.login, repo.name, issue.number)
}

const knownBots = new Set(['renovate', 'renovate[bot]'])
export async function indexIssue(issue: Issue | RestIssue, repository: { owner: { login: string }, name: string }) {
  if (issue.user && (knownBots.has(issue.user.login) || issue.user.login.endsWith('[bot]'))) {
    return
  }
  if (issue.pull_request) {
    return
  }

  const vectorize = typeof hubVectorize !== 'undefined' ? hubVectorize('issues') : null

  const issueUpdatedTime = new Date(issue.updated_at).getTime()

  const text = chunkIssue(issue)
  const issueHash = hash(text)

  const issueMetadata: IssueMetadata = {
    owner: repository.owner.login,
    repository: repository.name,
    number: issue.number,
    title: issue.title,
    url: issue.html_url,
    updated_at: issue.updated_at,
    labels: issue.labels?.map(l => typeof l === 'string' ? l : JSON.stringify({ name: l.name, color: l.color })) || [],
    state: issue.state || 'open',
  }

  const drizzle = useDrizzle()
  const res = await drizzle.select().from(tables.issues).where(eq(tables.issues.number, issue.number)).get()
  if (res && (res.mtime <= issueUpdatedTime || res.hash === issueHash)) {
    return await Promise.all([
      vectorize?.upsert([{
        id: storageKeyForIssue(repository.owner.login, repository.name, issue.number),
        values: JSON.parse(res.embeddings) as number[],
        metadata: issueMetadata,
      }]),
      drizzle.update(tables.issues).set({
        ...issueMetadata,
        labels: JSON.stringify(issue.labels),
        mtime: issueUpdatedTime,
      }).where(eq(tables.issues.number, issue.number)).execute(),
    ])
  }

  const embeddings = await generateEmbedding(text)

  await Promise.all([
    vectorize?.upsert([{
      id: storageKeyForIssue(repository.owner.login, repository.name, issue.number),
      values: embeddings,
      metadata: issueMetadata,
    }]),
    drizzle.insert(tables.issues).values({
      ...issueMetadata,
      labels: JSON.stringify(issue.labels),
      mtime: issueUpdatedTime,
      embeddings: JSON.stringify(embeddings),
    }),
    // .where(eq(tables.issues.number, issue.number)).execute(),
  ])

  console.log('indexed issue:', issueMetadata)

  return embeddings
}

export interface IssueMetadata {
  owner: string
  repository: string
  number: number
  title: string
  url: string
  updated_at: string
  labels: string[]
  state: string
  [key: string]: string | number | boolean | string[]
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
  const ai = hubAI()
  try {
    const { data } = await ai.run('@cf/baai/bge-large-en-v1.5', { text })
    return data[0]!
  }
  catch {
    return []
  }
}

function getLabels(issue: Pick<Issue | RestIssue, IssueSegments>) {
  return issue.labels?.map(label => (typeof label === 'string' ? label : label.name!).toLowerCase()).filter(Boolean) || []
}
