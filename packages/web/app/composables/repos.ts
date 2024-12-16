export function useRepos() {
  return useFetch('/api/repos', {
    baseURL: useRuntimeConfig().public.remote,
    getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] || nuxtApp.static.data[key],
    default: () => [],
  })
}
