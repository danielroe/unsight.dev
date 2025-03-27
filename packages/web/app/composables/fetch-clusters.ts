import type { IssueMetadata } from '~~/shared/models/github-metadata'

export function useFetchClusters(selectedRepo: Ref<string>) {
  return useFetch<IssueMetadata[]>(() => `/api/clusters/${selectedRepo.value}`, {
    key: 'clusters',
    baseURL: useRuntimeConfig().public.remote,
    default: () => [],
  })
}
