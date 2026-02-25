import type { TaskPayload } from '~~/server/tasks/add-repo'

export default defineNitroPlugin(async (nitro) => {
  const config = useRuntimeConfig()

  nitro.hooks.hook('request', async () => {
    await runTask('add-repo', {
      payload: {
        repos: config.localDev.presetRepos,
        index: true,
      } satisfies TaskPayload,
    })
  })
})
