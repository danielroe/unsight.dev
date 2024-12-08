import { isAllowedRepo } from '#shared/repos'

export default defineNuxtPlugin(() => {
  useRouter().beforeEach((to) => {
    const repo = to.path.slice(1)
    if (repo && !isAllowedRepo(repo as string)) {
      return navigateTo('/')
    }
  })
})
