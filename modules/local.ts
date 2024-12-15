import { addServerPlugin, createResolver, defineNuxtModule, updateRuntimeConfig, useRuntimeConfig } from 'nuxt/kit'
import consola from 'consola'
import defu from 'defu'

export interface ModuleOptions {
  /**
   * Enable UI-only mode for local development
   *
   * **When ui-only mode is enabled, other local development features can't be used**
   *
   * @default false
   */
  uiOnly: boolean

  /**
   * Preset repos for local development
   *
   * The preset repos will be indexed at startup
   *
   * @default []
   */
  presetRepos: string[]
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'local-dev',
    configKey: 'localDev',
  },
  defaults: {
    uiOnly: false,
    presetRepos: [],
  },
  setup(_options, nuxt) {
    const config = useRuntimeConfig()

    const options: ModuleOptions = defu(config.public.localDev || {}, _options)

    updateRuntimeConfig({
      public: {
        localDev: options,
      },
    })

    if (!nuxt.options.dev) {
      return
    }

    if (process.argv.includes('--ui-only') || options.uiOnly) {
      consola.info('Enabling UI-only mode for local development')
      options.uiOnly = true
      updateRuntimeConfig({
        public: {
          remote: 'https://unsight.dev',
        },
      })

      return
    }

    const { resolve } = createResolver(import.meta.url)

    if (process.env.PRESET_REPOS) {
      options.presetRepos = process.env.PRESET_REPOS.split(',').filter(Boolean)
    }

    if (options.presetRepos.length) {
      addServerPlugin(resolve('../server/plugins/preset-repo'))
    }
  },
})
