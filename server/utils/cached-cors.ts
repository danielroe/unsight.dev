import type { EventHandler } from 'h3'
import type { CacheOptions } from 'nitropack/types'

export function defineCachedCorsEventHandler(eventHandler: EventHandler, cacheOptions?: CacheOptions) {
  const handler = defineCachedEventHandler(eventHandler, cacheOptions)

  return defineEventHandler(async (event) => {
    const handled = handleCors(event, {
      methods: ['GET', 'OPTIONS', 'HEAD'],
      preflight: {
        statusCode: 204,
      },
      origin: ['http://localhost:3000', 'https://unsight.dev', 'https://github.com'],
    })

    if (handled || event.method !== 'GET') {
      return
    }

    return handler(event)
  })
}
