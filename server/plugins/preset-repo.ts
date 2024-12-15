import type { TaskPayload } from '~~/server/tasks/add-repo'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()

  const { presetRepos } = config.public.localDev

  onHubReady(async () => {
    runTask('add-repo', {
      payload: {
        repos: presetRepos,
        index: true,
      } satisfies TaskPayload,
    })
  })
})
