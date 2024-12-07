// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@unocss/nuxt', '@nuxt/eslint', '@nuxthub/core', '@nuxt/icon'],
  devtools: { enabled: true },
  app: { head: { htmlAttrs: { lang: 'en' } } },
  runtimeConfig: {
    github: {
      token: '',
    },
  },
  future: { compatibilityVersion: 4 },
  compatibilityDate: '2024-04-03',
  hub: {
    ai: true,
    cache: true,
    kv: true,
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
})
