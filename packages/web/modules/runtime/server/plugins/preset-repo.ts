import type { TaskPayload } from '#server/tasks/add-repo'

export default defineNitroPlugin(async (nitro) => {
  const config = useRuntimeConfig()

  nitro.hooks.hookOnce('request', async () => {
    runTask('add-repo', {
      payload: {
        repos: config.localDev.presetRepos,
        index: true,
      } satisfies TaskPayload,
    }).catch((err) => {
      console.error('[preset-repo] Failed to add repos:', err)
    })
  })
})
