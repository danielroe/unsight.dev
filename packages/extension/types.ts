export interface Issue {
  description: string
  labels: Array<string>
  number: number
  url: string
  state: 'open' | 'closed'
  title: string
  updated_at: string
  owner: string
  repository: string
  score: number
}
