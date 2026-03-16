// @ts-check
import antfu from '@antfu/eslint-config'
import withNuxt from './packages/web/.nuxt/eslint.config.mjs'

export default withNuxt(await antfu({ vue: true })).append(
  {
    files: ['packages/web/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.yml'],
    rules: {
      '@stylistic/spaced-comment': 'off',
    },
  },
)
