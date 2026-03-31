import type { Installation, InstallationLite, WebhookEvent } from '@octokit/webhooks-types'
import type { H3Event } from 'h3'
import type { InstallationRepo } from '~~/server/utils/metadata'
import { createAppAuth } from '@octokit/auth-app'

import { Octokit } from '@octokit/rest'
import { invalidateCluster } from '~~/server/api/clusters/[owner]/[repo].get'
import { invalidateDuplicates } from '~~/server/api/duplicates/[owner]/[repo].get'
import { invalidateRepos } from '~~/server/api/repos.get'
import { indexRepo } from '~~/server/utils/index-repo'
import { removeMetadataForRepo } from '~~/server/utils/metadata'
import { indexIssue, removeIssue, removeStoredEmbeddingsForRepo } from '../../utils/embeddings'

export default defineEventHandler(async (event) => {
  const isValidWebhook = await isValidGithubWebhook(event)

  if (!isValidWebhook) {
    throw createError({ statusCode: 401, message: 'Unauthorized: webhook is not valid' })
  }

  const body = await readBody<WebhookEvent>(event)
  const promises: Promise<unknown>[] = []
  if ('action' in body && 'installation' in body && !('client_payload' in body)) {
    if ('repository' in body && body.installation && body.repository) {
      const repoMetadata = await getMetadataForRepo(body.repository.owner.login, body.repository.name)
      if (repoMetadata && !repoMetadata.indexed) {
        promises.push(addRepos(event, body.installation, [body.repository]))
      }
    }
    if (body.action === 'created' && 'repositories' in body) {
      promises.push(addRepos(event, body.installation, body.repositories || []))
    }
    if (body.action === 'deleted' && 'repositories' in body) {
      for (const repo of body.repositories || []) {
        promises.push(deleteRepo(event, repo))
      }
    }
    if ((body.action === 'added' || body.action === 'removed')) {
      if ('repositories_added' in body) {
        promises.push(addRepos(event, body.installation, body.repositories_added))
      }
      if ('repositories_removed' in body) {
        for (const repo of body.repositories_removed) {
          promises.push(deleteRepo(event, repo))
        }
      }
    }
    if (body.action === 'publicized' && body.installation) {
      promises.push(addRepos(event, body.installation, [body.repository]))
    }
    if (body.action === 'privatized') {
      promises.push(deleteRepo(event, body.repository))
    }
  }

  if ('issue' in body) {
    switch (body.action) {
      case 'created':
      case 'edited':
      case 'opened':
        promises.push(indexIssue(body.issue, body.repository))
        break

      case 'reopened':
      case 'closed': {
        promises.push(indexIssue(body.issue, body.repository))
        promises.push(invalidateCluster(body.repository.owner.login, body.repository.name))
        promises.push(invalidateDuplicates(body.repository.owner.login, body.repository.name))
        break
      }

      case 'transferred':
      case 'deleted': {
        promises.push(removeIssue(body.issue, body.repository))
        promises.push(invalidateCluster(body.repository.owner.login, body.repository.name))
        promises.push(invalidateDuplicates(body.repository.owner.login, body.repository.name))
        break
      }
    }
  }

  event.waitUntil(Promise.allSettled(promises))

  return null
})

async function addRepos(event: H3Event, installation: Installation | InstallationLite, repos: InstallationRepo[]) {
  const config = useRuntimeConfig(event)
  const octokit = new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: config.github.appId,
      privateKey: config.github.privateKey,
      installationId: installation.id,
    },
  })

  event.waitUntil(Promise.all(repos.map((repo) => {
    if (repo.private) {
      return undefined
    }
    return useDrizzle().insert(tables.repos).values({
      full_name: repo.full_name.toLowerCase(),
      id: repo.id,
      node_id: repo.node_id,
      private: +repo.private,
      indexed: 0,
    }).onConflictDoNothing()
  })))

  for (const repo of repos) {
    if (repo.private) {
      continue
    }

    // Use time-bounded indexing; the webhook doesn't need to finish everything.
    // Incomplete repos will be picked up by the index-repo task on the next invocation.
    await indexRepo(octokit, repo)
  }

  // Invalidate repos cache so the next index-repo task sees the updated state
  await invalidateRepos().catch(e => console.warn('Failed to invalidate repos cache:', e))
}

async function deleteRepo(_event: H3Event, repo: InstallationRepo) {
  const [owner, name] = repo.full_name.split('/')

  await removeStoredEmbeddingsForRepo(owner!, name!)
  await removeMetadataForRepo(owner!, name!)
}
