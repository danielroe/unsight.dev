import consola from 'consola'

export default defineNitroPlugin(async () => {
  const runtimeConfig = useRuntimeConfig()

  // TODO: check UI-only mode more elegantly
  if (!import.meta.dev || runtimeConfig.public.remote !== '/') {
    return
  }

  if (runtimeConfig.presetRepo == null) {
    return
  }

  const repos = runtimeConfig.presetRepo.split(',').filter(Boolean)

  onHubReady(async () => {
    const kv = hubKV()
    const presetRepo = []
    for (const repo of repos) {
      const [owner, name] = repo.split('/')
      if (await kv.hasItem(`repo:${owner}:${name}`)) {
        continue
      }

      presetRepo.push(repo)
      await kv.setItem(`repo:${owner}:${name}`, null)
    }

    if (!presetRepo.length) {
      return
    }

    consola.info(`Preset repo ${presetRepo.join(', ')} indexing...`)

    runTask('index-repo', {
      payload: {
        filter: presetRepo,
        tryResolveMeta: true,
      },
    })
  })
})
