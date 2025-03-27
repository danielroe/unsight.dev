import type { IssueMetadata } from '~~/shared/models/github-metadata'

export function useFetchDuplicates(selectedRepo: Ref<string>) {
  return useFetch<IssueMetadata[]>(() => `/api/duplicates/${selectedRepo.value}`, {
    key: 'duplicates',
    baseURL: useRuntimeConfig().public.remote,
    default: () => [],
  })
}
