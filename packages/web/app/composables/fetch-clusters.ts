import type { ClusterMetadata } from '~~/shared/models/github-metadata'

export function useFetchClusters(selectedRepo: Ref<string>) {
  return useFetch<ClusterMetadata[]>(() => `/api/clusters/${selectedRepo.value}`, {
    key: 'clusters',
    baseURL: useRuntimeConfig().public.remote,
    default: () => [],
  })
}
