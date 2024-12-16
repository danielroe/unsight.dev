import type { StoredEmbeddings } from '~~/server/utils/embeddings'
import { defineTask } from 'nitropack/runtime'

export default defineTask({
  meta: {
    name: 'populate-vectorize',
    description: 'Populate Vectorize with issue embeddings',
  },
  async run() {
    const kv = hubKV()
    const vectorize = typeof hubVectorize !== 'undefined' ? hubVectorize('issues') : null
    if (!vectorize) {
      return { error: 'Vectorize not available' }
    }
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
              metadata: issue.value.metadata,
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
      return { keys }
    }

    return { count }
  },
})
