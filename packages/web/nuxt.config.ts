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
  css: [
    '@unocss/reset/tailwind-compat.css',
  ],
  runtimeConfig: {
    public: {
      remote: '/',
      github: {
        appSlug: 'unsight-dev',
      },
    },
    github: {
      token: '',
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
  nitro: {
    experimental: {
      tasks: true,
    },
  },
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
  typescript: {
    hoist: ['nitropack/runtime'],
  },
  eslint: {
    config: {
      standalone: false,
      stylistic: true,
    },
  },
  unocss: {
    icons: true,
    theme: {
      colors: {
        'shark-500': '#202830',
        'shark-400': '#333c45',
        'shark-300': '#3F4953',
        'shark-200': '#4F5A65',
        'shark-100': '#636E7A',
      },
    },
  },
})
