import type { RestEndpointMethodTypes } from '@octokit/rest'
import type { Issue, Repository } from '@octokit/webhooks-types'
import { hash } from 'ohash'

type RestIssue = RestEndpointMethodTypes['issues']['get']['response']['data']

export function storageKeyForIssue(owner: string, repo: string, number: number | string) {
  return `issue:${owner}:${repo}:${number}`
}

export function storagePrefixForRepo(owner: string, repo: string) {
  return `issue:${owner}:${repo}:`
}

export async function getStoredMetadataForIssue(owner: string, repo: string, number: number) {
  const kv = hubKV()
  const res = await kv.getItem<StoredEmbeddings>(storageKeyForIssue(owner, repo, number))
  return res?.metadata
}

export async function getStoredEmbeddingsForRepo(owner: string, repo: string) {
  const kv = hubKV()
  const keys = await kv.getKeys(storagePrefixForRepo(owner, repo))
  const res = await kv.getItems(keys)
  return res.map(i => i.value as StoredEmbeddings)
}

export async function removeStoredEmbeddingsForRepo(owner: string, repo: string) {
  const kv = hubKV()
  const keys = await kv.getKeys(storagePrefixForRepo(owner!, repo!))
  await Promise.allSettled(keys.map(async key => kv.removeItem(key))).then((r) => {
    if (r.some(p => p.status === 'rejected')) {
      console.error('Failed to remove some issues from', `${owner}/${repo}`)
    }
  })

  console.log('removed all', keys.length, 'issues from', `${owner}/${repo}`)
}

export async function removeIssue(issue: Issue, repo: Repository) {
  const storage = hubKV()
  await storage.removeItem(storageKeyForIssue(repo.owner.login, repo.name, issue.number))
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

  const storage = hubKV()
  const vectorize = typeof hubVectorize !== 'undefined' ? hubVectorize('issues') : null

  const storageKey = storageKeyForIssue(repository.owner.login, repository.name, issue.number)
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
  }

  const res = await storage.getItem<StoredEmbeddings>(storageKey)
  if (res && (res.mtime <= issueUpdatedTime || res.hash === issueHash)) {
    return await Promise.all([
      vectorize?.upsert([{
        id: storageKey,
        values: res.embeddings,
        metadata: issueMetadata,
      }]),
      storage.setItem(storageKey, {
        metadata: issueMetadata,
        mtime: issueUpdatedTime,
        hash: issueHash,
        embeddings: res.embeddings,
      }),
    ])
  }

  const embeddings = await generateEmbedding(text)

  await Promise.all([
    vectorize?.upsert([{
      id: storageKey,
      values: embeddings,
      metadata: issueMetadata,
    }]),
    storage.setItem(storageKey, {
      metadata: issueMetadata,
      mtime: issueUpdatedTime,
      hash: issueHash,
      embeddings,
    }),
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
  [key: string]: string | number | boolean | string[]
}

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

function chunkIssue(issue: Issue | RestIssue, exclude?: Set<string>) {
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

function getLabels(issue: Issue | RestIssue) {
  return issue.labels?.map(label => (typeof label === 'string' ? label : label.name!).toLowerCase()).filter(Boolean) || []
}
