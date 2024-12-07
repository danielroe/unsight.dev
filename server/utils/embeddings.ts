import type { H3Event } from 'h3'
import { hash } from 'ohash'

import { getLabels, type Issue } from './github'

export async function getEmbeddingsForIssue(event: H3Event, issue: Issue) {
  const storage = hubKV()
  const vectorize = hubVectorize('issues')
  if (!issue.repository) {
    const match = issue.repository_url.match(/\/(?<owner>[^/]+)\/(?<name>[^/]+)$/)
    if (match) {
      issue.repository = {
        owner: { name: match.groups!.owner! },
        name: match.groups!.name!,
      } as NonNullable<Issue['repository']>
    }
    else throw new Error('Issue does not have a repository')
  }

  const storageKey = `issue:${issue.repository!.owner.name}:${issue.repository!.name}:${issue.number}`
  const issueUpdatedTime = new Date(issue.updated_at).getTime()

  const text = chunkIssue(issue)
  const issueHash = hash(text)

  const res = await storage.getItem<StoredEmbeddings>(storageKey)
  if (res && res.mtime >= issueUpdatedTime && res.hash === issueHash) {
    return res.embeddings
  }

  const embeddings = await generateEmbedding(event, text)

  await Promise.all([
    vectorize.insert([{
      id: storageKey,
      values: embeddings,
      metadata: {
        title: issue.title,
        body: issue.body || '',
        owner: issue.repository!.owner.name!,
        repository: issue.repository!.name,
        number: issue.number,
      },
    }]),
    storage.setItem(storageKey, {
      mtime: issueUpdatedTime,
      hash: issueHash,
      embeddings,
    }),
  ])

  return embeddings
}

type StoredEmbeddings = {
  mtime: number
  hash: string
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

function chunkIssue(issue: Issue, exclude?: Set<string>) {
  const labels = getLabels(issue).filter(l => !exclude?.has(l))
  return preprocessText(`${issue.title}\n${labels.join(', ')}\n${issue.body}`)
}

async function generateEmbedding(event: H3Event, text: string): Promise<number[]> {
  const ai = hubAI()
  try {
    const { data } = await ai.run('@cf/baai/bge-large-en-v1.5', { text })
    return data[0]!
  }
  catch {
    return []
  }
}
