import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue', '@wxt-dev/unocss'],
  manifest: () => ({
    permissions: import.meta.env.FIREFOX ? ['https://unsight.dev/api/similarity/*'] : [],
  }),
})
