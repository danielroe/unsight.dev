import { kmeans } from 'ml-kmeans'
import { similarity } from 'ml-distance'

export function clusterEmbeddings<T extends { number: number, title: string }>(issues: T[], embeddings: number[][]) {
  for (let i = issues.length - 1; i >= 0; i--) {
    if (embeddings[i]!.length === 0) {
      console.warn(`Failed to generate embedding for an issue: [#${issues[i]!.number}] ${issues[i]!.title}`)
      issues.splice(i, 1)
      embeddings.splice(i, 1)
    }
  }

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
        if (issue === other) {
          continue
        }
        totalSimilarity += similarity.cosine(embeddings[issues.indexOf(issue)], embeddings[issues.indexOf(other)])
      }
      return { ...issue, avgSimilarity: Math.floor(100 * totalSimilarity / (chunk.length - 1)) / 100 }
    })

    const similarityThreshold = 0.30 // 0.75

    sortedChunk = sortedChunk.filter(i => i.avgSimilarity >= similarityThreshold).sort((a, b) => b.avgSimilarity - a.avgSimilarity)

    if (sortedChunk.length > 1) {
      sortedClusters.push(sortedChunk)
    }
  }

  return sortedClusters
}
