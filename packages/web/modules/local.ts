import process from 'node:process'
import consola from 'consola'
import { defineNuxtModule, updateRuntimeConfig } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'local-dev',
  },
  setup(_options, nuxt) {
    if (!nuxt.options.dev) {
      return
    }

    if (process.argv.includes('--ui-only')) {
      consola.info('Enabling UI-only mode for local development')
      updateRuntimeConfig({
        public: {
          remote: 'https://unsight.dev',
        },
      })
    }
  },
})
