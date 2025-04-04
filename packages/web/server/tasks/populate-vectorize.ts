import type { StoredEmbeddings } from '~~/server/utils/embeddings'
import { defineTask } from 'nitropack/runtime'

export default defineTask({
  meta: {
    name: 'populate-vectorize',
    description: 'Populate Vectorize with issue embeddings',
  },
  async run() {
    const vectorize = typeof hubVectorize !== 'undefined' ? hubVectorize('issues') : null
    if (!vectorize) {
      return { result: 'Vectorize not available' }
    }
    const kv = hubKV()
    const keys = await kv.getKeys('issue:').then(r => r.reverse())
    console.info('Loaded', keys.length, 'issues')
    const total = keys.length
    let count = 1
    try {
      do {
        const batch = await kv.getItems<StoredEmbeddings>(keys.splice(0, 100))
        for (const issue of batch) {
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
