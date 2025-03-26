import type { IssueMetadata } from '~~/shared/models/github-metadata'

export function useFetchClusters(selectedRepo: Ref<string>) {
  return useFetch<IssueMetadata[]>(() => `/api/clusters/${selectedRepo.value}`, {
    baseURL: useRuntimeConfig().public.remote,
    default: () => [],
  })
}
