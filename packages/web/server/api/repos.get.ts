import { defineCachedCorsEventHandler } from '~~/server/utils/cached-cors'
import { getMetadataForRepo } from '~~/server/utils/metadata'

export default defineCachedCorsEventHandler(async () => {
  const kv = hubKV()
  const keys = await kv.getKeys('repo')
  return Promise.all(keys.map(async (key) => {
    const [owner, name] = key.split(':').slice(1)
    if (!owner || !name) {
      return []
    }
    const [keys, meta] = await Promise.all([
      kv.getKeys(storagePrefixForRepo(owner, name)),
      getMetadataForRepo(owner, name),
    ])
    return [{
      repo: `${owner}/${name}`,
      issuesIndexed: keys.length,
      indexed: meta?.indexed || false,
    }]
  })).then(r => r.flat())
}, { swr: true })
