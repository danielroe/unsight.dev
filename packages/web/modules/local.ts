import process from 'node:process'
import consola from 'consola'
import { addServerPlugin, createResolver, defineNuxtModule, updateRuntimeConfig } from 'nuxt/kit'

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
   * Repositories to index at startup when running in local development mode
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
  defaults: () => ({
    uiOnly: process.argv.includes('--ui-only'),
    presetRepos: ('DEV_REPOS_TO_INDEX' in process.env && process.env.DEV_REPOS_TO_INDEX)
      ? process.env.DEV_REPOS_TO_INDEX.split(',').filter(Boolean)
      : ['nitrojs/nitro', 'nuxt/nuxt'],
  }),
  setup(options, nuxt) {
    if (!nuxt.options.dev && !nuxt.options._prepare) {
      return
    }

    // ensure types are correct even if we don't add the server plugin
    updateRuntimeConfig({
      localDev: { presetRepos: options.presetRepos },
    })

    if (options.uiOnly) {
      consola.info('Enabling UI-only mode for local development')
      updateRuntimeConfig({
        public: {
          remote: 'https://unsight.dev',
        },
      })

      return
    }

    const resolver = createResolver(import.meta.url)

    if (options.presetRepos.length && !process.argv.includes('--remote')) {
      addServerPlugin(resolver.resolve('../server/plugins/preset-repo'))
    }
  },
})
