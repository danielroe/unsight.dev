/**
 * Get the Cloudflare AI binding, or a REST API fallback for local development.
 *
 * Set NUXT_CLOUDFLARE_ACCOUNT_ID and NUXT_CLOUDFLARE_API_TOKEN in your .env
 * to use the Cloudflare AI REST API locally.
 */
export function useAI(): { run: (model: string, input: unknown) => Promise<unknown> } | null {
  const binding = useEvent()?.context.cloudflare?.env?.AI
  if (binding) return binding

  // Fallback to Cloudflare AI REST API for local dev
  const config = useRuntimeConfig()
  const { accountId, apiToken } = config.cloudflare
  if (!accountId || !apiToken) {
    return null
  }

  return {
    async run(model: string, input: unknown) {
      const response = await $fetch<Record<string, unknown>>(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiToken}` },
          body: input as Record<string, unknown>,
        },
      )
      return response.result
    },
  }
}
