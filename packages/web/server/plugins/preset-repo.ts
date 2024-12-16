import type { TaskPayload } from '~~/server/tasks/add-repo'

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig()

  onHubReady(async () => {
    runTask('add-repo', {
      payload: {
        repos: config.localDev.presetRepos,
        index: true,
      } satisfies TaskPayload,
    })
  })
})
