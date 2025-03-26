import type { RepoMetadata } from '~~/shared/models/github-metadata'

export function useFetchRepos() {
  return useFetch<RepoMetadata[]>('/api/repos', {
    baseURL: useRuntimeConfig().public.remote,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key],
    default: () => [],
  })
}
