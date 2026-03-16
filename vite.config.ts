import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '*.{js,ts,tsx,vue,mjs,cjs,json,.*rc}': 'vp exec eslint --fix',
  },
})
