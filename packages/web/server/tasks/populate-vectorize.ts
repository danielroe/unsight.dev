import type { StoredEmbeddings } from '~~/server/utils/embeddings'
import { kv } from 'hub:kv'
import { defineTask } from 'nitropack/runtime'

export default defineTask({
  meta: {
    name: 'populate-vectorize',
    description: 'Populate Vectorize with issue embeddings',
  },
  async run() {
    const vectorize = useEvent()!.context.cloudflare?.env?.VECTORIZE_ISSUES || null
    if (!vectorize) {
      return { result: 'Vectorize not available' }
    }
    const keys = await kv.keys('issue:').then((r: string[]) => r.reverse())
    console.info('Loaded', keys.length, 'issues')
    const total = keys.length
    let count = 1
    try {
      do {
        const batchKeys = keys.splice(0, 100)
        const batch = await Promise.all(batchKeys.map(async (key: string) => ({
          key,
          value: await kv.get<StoredEmbeddings>(key),
        })))
        for (const issue of batch) {
          if (!issue.value)
            continue
          try {
            await vectorize.insert([{
              id: issue.key,
              values: issue.value.embeddings,
              metadata: { ...issue.value.metadata, labels: JSON.stringify(issue.value.metadata.labels) },
            }])
            console.log(`${count++}/${total}`)
          }
          catch {
            keys.push(issue.key)
            console.log('retrying', issue.key)
          }
        }
      } while (keys.length > 0)
    }
    catch {
      return {
        result: `Failed to populate Vectorize with issue embeddings while processing ${keys.length} issues`,
      }
    }

    return {
      result: `Populated Vectorize with ${total} issue embeddings`,
    }
  },
})
