const DEFAULT_REPO = 'nuxt/nuxt'

const selectedRepo = ref<string>(DEFAULT_REPO)

export function useSelectedRepo(owner: string, repo: string) {
  selectedRepo.value = owner && repo ? `${owner}/${repo}` : DEFAULT_REPO
  return selectedRepo
}
