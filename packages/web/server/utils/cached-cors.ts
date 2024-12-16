import type { EventHandler, EventHandlerRequest, EventHandlerResponse } from 'h3'
import type { CacheOptions } from 'nitropack/types'

export function defineCachedCorsEventHandler<Request extends EventHandlerRequest = EventHandlerRequest, Response = EventHandlerResponse>(eventHandler: EventHandler<Request, Response>, cacheOptions?: CacheOptions): EventHandler<Request, Response> {
  const handler = defineCachedEventHandler(eventHandler, cacheOptions)

  return defineEventHandler((event) => {
    const handled = handleCors(event, {
      methods: ['GET', 'OPTIONS', 'HEAD'],
      preflight: {
        statusCode: 204,
      },
      origin: ['http://localhost:3000', 'https://unsight.dev', 'https://github.com'],
    })

    if (handled || event.method !== 'GET') {
      return undefined as Response
    }

    return handler(event)
  })
}
