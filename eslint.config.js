// @ts-check
import antfu from '@antfu/eslint-config'
import withNuxt from './packages/web/.nuxt/eslint.config.mjs'

export default withNuxt(antfu()).append(
  {
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
