import { isAllowedRepo } from '#shared/repos'

export default defineNuxtRouteMiddleware((to) => {
  if ('owner' in to.params && (to.params.owner || to.params.repo) && !isAllowedRepo(`${to.params.owner}/${to.params.repo}`)) {
    return navigateTo('/')
  }
})
