import { similarity } from 'ml-distance'
import { kmeans } from 'ml-kmeans'
import { chunkIssue } from '~~/server/utils/embeddings'

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

  const clusteredIssues: Record<string, T[]> = {}
  for (let i = 0; i < issues.length; i++) {
    clusteredIssues[clusters[i]!] ||= []
    clusteredIssues[clusters[i]!]!.push(issues[i]!)
  }

  const sortedClusters: Array<Array<T & { avgSimilarity: number }>> = []

  for (const cluster in clusteredIssues) {
    const chunk = clusteredIssues[cluster]!
    let sortedChunk = chunk.map((issue) => {
      let totalSimilarity = 0
      for (const other of chunk) {
        if (issue !== other) {
          totalSimilarity += similarity.cosine(embeddings[issues.indexOf(issue)], embeddings[issues.indexOf(other)])
        }
      }
      return { ...issue, avgSimilarity: Math.floor(100 * totalSimilarity / (chunk.length - 1)) / 100 }
    })

    const similarityThreshold = 0.30

    sortedChunk = sortedChunk.filter(i => i.avgSimilarity >= similarityThreshold).sort((a, b) => b.avgSimilarity - a.avgSimilarity)

    if (sortedChunk.length > 1) {
      sortedClusters.push(sortedChunk)
    }
  }

  return sortedClusters
}

export function findDuplicates<T extends { number: number, title: string }>(_issues: T[], _embeddings: number[][]) {
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

  const duplicates: Array<Array<T & { score: number }>> = []
  for (let i = 0; i < issues.length; i++) {
    const embedding = embeddings[i]
    const chunk: Array<T & { score: number }> = []
    for (let j = i + 1; j < issues.length; j++) {
      const issue = issues[j]!
      const score = similarity.cosine(embedding, embeddings[j])
      if (score > 0.85) {
        chunk.push({ ...issue, score })
      }
    }
    if (chunk.length > 0) {
      duplicates.push([{ ...issues[i]!, score: 1 }, ...chunk])
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

    const { generateText } = await import('ai')
    const { createWorkersAI } = await import('workers-ai-provider')
    const workersai = createWorkersAI({ binding: useEvent()!.context.cloudflare.env.AI })
    const { text } = await generateText({
      model: workersai('@hf/nousresearch/hermes-2-pro-mistral-7b'),
      prompt,
      temperature: 0.2,
    })

    return text?.trim().replace(/^["']|["']$/g, '').replace(/^title:?\s*|\s*cluster$/i, '') || ''
  }
  catch (error) {
    console.error('Error generating cluster name:', error)
    return 'Unnamed cluster' // Fallback name
  }
}
