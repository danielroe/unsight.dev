// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@unocss/nuxt',
    '@nuxt/eslint',
    '@nuxthub/core',
    'nuxt-time',
    '@nuxtjs/html-validator',
    // TODO: 'nuxt-og-image',
    'nuxt-webhook-validators',
  ],
  devtools: { enabled: true },
  app: {
    pageTransition: false,
    layoutTransition: false,
    head: {
      charset: 'utf-8',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      htmlAttrs: { lang: 'en' },
    },
  },
  runtimeConfig: {
    public: {
      remote: '/',
    },
    github: {
      appId: '',
      privateKey: '',
    },
  },
  sourcemap: {
    client: true,
  },
  future: { compatibilityVersion: 4 },
  experimental: {
    viewTransition: true,
    typedPages: true,
  },
  compatibilityDate: '2024-04-03',
  hub: {
    ai: true,
    analytics: true,
    cache: true,
    vectorize: {
      issues: {
        dimensions: 1024,
        metric: 'euclidean',
        metadataIndexes: {
          owner: 'string',
          repository: 'string',
        },
      },
    },
    kv: true,
  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
  unocss: {
    icons: true,
  },
})
