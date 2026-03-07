import { defineConfig } from 'wxt'

// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-vue', '@wxt-dev/unocss', '@wxt-dev/auto-icons'],
  manifest: env => ({
    host_permissions: env.browser === 'firefox' ? ['https://unsight.dev/api/*'] : undefined,
    browser_specific_settings: env.browser === 'firefox'
      ? {
          gecko: {
            id: '{b5fe58db-5527-42ae-91df-715d7d9110d6}',
            data_collection_permissions: {
              isTechnicalDataSent: false,
              isInteractionDataSent: false,
            },
          },
        }
      : undefined,
  }),
})
