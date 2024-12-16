import { similarity } from 'ml-distance'
import { kmeans } from 'ml-kmeans'

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

  const duplicates: Map<T, [T, number][]> = new Map()
  for (let i = 0; i < issues.length; i++) {
    const embedding = embeddings[i]
    for (let j = i + 1; j < issues.length; j++) {
      const issue = issues[j]!
      const score = similarity.cosine(embedding, embeddings[j])
      if (score > 0.85) {
        duplicates.set(issues[i]!, [...duplicates.get(issues[i]!) || [], [issue, score]])
      }
    }
  }

  return [...duplicates.entries()]
}
