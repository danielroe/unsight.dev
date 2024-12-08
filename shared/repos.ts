export const allowedRepos = ['nuxt/nuxt', 'vuejs/core', 'vitejs/vite', 'nitrojs/nitro', 'danielroe/beasties', 'unjs/h3', 'unjs/c12', 'unjs/unenv', 'unjs/ofetch', 'rollup/rollup', 'GoogleChromeLabs/critters'] as const

export type AllowedRepo = typeof allowedRepos[number]

export function isAllowedRepo(repo: string): repo is AllowedRepo {
  return allowedRepos.includes(repo as AllowedRepo)
}
