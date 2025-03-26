export interface RepoMetadata {
  repo: string
  issuesIndexed: number
  indexed: boolean
}

export interface IssueMetadata {
  url: string
  title: string
  owner: string
  repository: string
  updated_at: string
  number: number
  score: number
  labels: string[]
  [key: string]: string | number | boolean | string[]
}
