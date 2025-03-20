import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue', '@wxt-dev/unocss', '@wxt-dev/auto-icons'],
  manifest: env => ({
    host_permissions: env.browser === 'firefox' ? ['https://unsight.dev/api/*'] : undefined,
  }),
})
