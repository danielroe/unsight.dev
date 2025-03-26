export function useCommandConsolePlane() {
  const OWNER_REPO = 'owner-repo'

  const route = useRoute(OWNER_REPO)

  const { data: allowedRepos } = useFetchRepos()

  const { selectedRepo } = useSelectedRepo(route.params.owner, route.params.repo)

  const { refresh, status } = useFetchClusters(selectedRepo)

  function navigateToRepo(event: Event) {
    const [owner, repo] = (event.target as HTMLSelectElement).value.split('/') as [string, string]
    return navigateTo({
      name: OWNER_REPO,
      params: { owner, repo },
    })
  }

  return {
    selectedRepo,
    allowedRepos,
    status,
    refresh,
    navigateToRepo,
  }
}
