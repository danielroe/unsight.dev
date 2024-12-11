import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'

export default defineCachedCorsEventHandler(async () => {
  const kv = hubKV()
  const keys = await kv.getKeys('repo')
  return keys.flatMap((key) => {
    const [owner, name] = key.split(':').slice(1)
    if (!owner || !name) {
      return []
    }
    return [`${owner}/${name}`]
  })
}, { swr: true })
