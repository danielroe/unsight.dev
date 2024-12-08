import { isAllowedRepo } from '#shared/repos'

export default defineNuxtPlugin(() => {
  useRouter().beforeEach((to) => {
    if (to.query.repo && !isAllowedRepo(to.query.repo as string)) {
      return navigateTo('/')
    }
  })
})
