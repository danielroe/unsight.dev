import type { IssueMetadata } from '~~/shared/models/github-metadata'

export function useFetchSimilar(owner: string, repo: string, issue: string) {
  return useFetch<IssueMetadata[]>(`/api/similarity/${owner}/${repo}/${issue}`, {
    key: 'similar',
    baseURL: useRuntimeConfig().public.remote,
    transform: data => data.filter((issue): issue is NonNullable<IssueMetadata> => !!(issue?.url)),
    default: () => [],
  })
}
