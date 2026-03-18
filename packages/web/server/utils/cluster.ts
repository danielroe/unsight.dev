import { similarity } from 'ml-distance'
import { kmeans } from 'ml-kmeans'
import { chunkIssue } from '~~/server/utils/embeddings'

const STRIP_QUOTES_RE = /^["']|["']$/g
const STRIP_PREFIX_RE = /^title:?\s*|\s*cluster$/i

export function clusterEmbeddings<T extends { number: number, title: string }>(_issues: T[], _embeddings: number[][]) {
  const validIndices = []
  for (let i = 0; i < _issues.length; i++) {
    if (_embeddings[i]!.length > 0) {
      validIndices.push(i)
    }
    else {
      console.warn(`Failed to generate embedding for an issue: [#${_issues[i]!.number}] ${_issues[i]!.title}`)
    }
  }

  const issues = validIndices.map(i => _issues[i]!)
  const embeddings = validIndices.map(i => _embeddings[i]!)

  // Determine the number of clusters (this is a simplistic approach; we might want to use a more sophisticated method)
  const k = embeddings.length < 11 ? Math.ceil(embeddings.length / 2) : Math.max(10, Math.floor(Math.sqrt(embeddings.length) / 2))
  const { clusters } = kmeans(embeddings, k, {})

  const clusteredIssueIndices: Record<string, number[]> = {}
  for (let i = 0; i < issues.length; i++) {
    clusteredIssueIndices[clusters[i]!] ||= []
    clusteredIssueIndices[clusters[i]!]!.push(i)
  }

  const sortedClusters: Array<Array<T & { avgSimilarity: number }>> = []

  for (const cluster in clusteredIssueIndices) {
    const indices = clusteredIssueIndices[cluster]!
    let sortedChunk = indices.map((idx) => {
      let totalSimilarity = 0
      for (const otherIdx of indices) {
        if (idx !== otherIdx) {
          totalSimilarity += similarity.cosine(embeddings[idx]!, embeddings[otherIdx]!)
        }
      }
      const divisor = indices.length - 1
      return { ...issues[idx]!, avgSimilarity: divisor > 0 ? Math.floor(100 * totalSimilarity / divisor) / 100 : 0 }
    })

    const similarityThreshold = 0.30

    sortedChunk = sortedChunk.filter(i => i.avgSimilarity >= similarityThreshold).sort((a, b) => b.avgSimilarity - a.avgSimilarity)

    if (sortedChunk.length > 1) {
      sortedClusters.push(sortedChunk)
    }
  }

  return sortedClusters
}

export function findDuplicates<T extends { number: number, title: string }>(_issues: T[], _embeddings: number[][], maxIssues = 2000, maxDuplicates = 200) {
  const validIndices = []
  for (let i = 0; i < _issues.length; i++) {
    if (_embeddings[i]!.length > 0) {
      validIndices.push(i)
    }
    else {
      console.warn(`Failed to generate embedding for an issue: [#${_issues[i]!.number}] ${_issues[i]!.title}`)
    }
  }

  const issues = validIndices.map(i => _issues[i]!).slice(0, maxIssues)
  const embeddings = validIndices.map(i => _embeddings[i]!).slice(0, maxIssues)

  if (issues.length > maxIssues) {
    console.warn(`Duplicate detection capped at ${maxIssues} issues (${validIndices.length} total)`)
  }

  const duplicates: Array<Array<T & { score: number }>> = []
  for (let i = 0; i < issues.length; i++) {
    const embedding = embeddings[i]
    const chunk: Array<T & { score: number }> = []
    for (let j = i + 1; j < issues.length; j++) {
      const score = similarity.cosine(embedding, embeddings[j])
      if (score > 0.85) {
        chunk.push({ ...issues[j]!, score })
      }
    }
    if (chunk.length > 0) {
      duplicates.push([{ ...issues[i]!, score: 1 }, ...chunk])
    }
    if (duplicates.length >= maxDuplicates) {
      break
    }
  }

  return duplicates
}

export async function generateClusterName<T extends { number: number, title: string, description?: string }>(clusterIssues: T[], otherClusters: T[][] = []): Promise<string> {
  const titles = clusterIssues.slice(0, 10).map(issue => chunkIssue(issue))
  const otherClusterTitles = otherClusters.slice(0, 3).map(cluster => cluster.slice(0, 3).map(issue => chunkIssue(issue)))

  try {
    const prompt = `
I need you to generate a short, unique title (4-5 words maximum) for a cluster of GitHub issues based on their common theme.

Issues in this cluster:
${titles.map(title => `- "${title}"`).join('\n')}

${otherClusterTitles.length > 0
  ? `
For context, here are examples from other distinct clusters:
${otherClusterTitles.map((cluster, i) => `
Cluster ${i + 1}:
${cluster.join('\n')}
`).join('\n')}
`
  : ''}

Based on these issues, identify the central theme that unites them and what makes this group distinct.
Generate only a short, descriptive phrase (4-5 words maximum) that captures the essence of this cluster.
Your response should contain ONLY the phrase - no explanation or other text. It should not contain general words like 'cluster' - it should be as short and simple as possible while still expressing the core theme of the cluster. It should be lowercase except for proper nouns and acronyms, and should not end with a period.
`

    const binding = useEvent()?.context.cloudflare?.env?.AI
    const { generateText } = await import('ai')

    let text: string
    if (binding) {
      const { createWorkersAI } = await import('workers-ai-provider')
      const workersai = createWorkersAI({ binding })
      const result = await generateText({
        model: workersai('@hf/nousresearch/hermes-2-pro-mistral-7b'),
        prompt,
        temperature: 0.2,
      })
      text = result.text
    }
    else {
      const ai = useAI()
      if (!ai) return 'Unnamed cluster'
      const res = await ai.run('@hf/nousresearch/hermes-2-pro-mistral-7b', {
        prompt,
        temperature: 0.2,
        max_tokens: 50,
      }) as { response?: string }
      text = res.response || ''
    }

    return text?.trim().replace(STRIP_QUOTES_RE, '').replace(STRIP_PREFIX_RE, '') || ''
  }
  catch (error) {
    console.error('Error generating cluster name:', error)
    return 'Unnamed cluster' // Fallback name
  }
}
