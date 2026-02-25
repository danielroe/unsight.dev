import type { Installation, InstallationLite, WebhookEvent } from '@octokit/webhooks-types'
import type { H3Event } from 'h3'
import type { InstallationRepo } from '~~/server/utils/metadata'
import { createAppAuth } from '@octokit/auth-app'

import { Octokit } from '@octokit/rest'
import { invalidateCluster } from '~~/server/api/clusters/[owner]/[repo].get'
import { currentIndexVersion, getMetadataForRepo, removeMetadataForRepo } from '~~/server/utils/metadata'
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
        break
      }

      case 'transferred':
      case 'deleted': {
        promises.push(removeIssue(body.issue, body.repository))
        promises.push(invalidateCluster(body.repository.owner.login, body.repository.name))
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

    await indexRepo(octokit, repo)

    event.waitUntil(useDrizzle().update(tables.repos).set({
      indexed: currentIndexVersion,
    }).where(eq(tables.repos.id, repo.id)))
  }
}

export async function indexRepo(octokit: Octokit, repo: InstallationRepo) {
  if (repo.private) {
    return
  }

  console.log('starting to index', `${repo.full_name}`)

  const [owner, name] = repo.full_name.split('/')
  const { repoId } = await useDrizzle().select({ repoId: tables.repos.id }).from(tables.repos).where(eq(tables.repos.full_name, `${owner}/${name}`.toLowerCase())).get() || {}
  if (!repoId) {
    console.error('Failed to find repoId for', `${owner}/${name}`)
    return
  }

  // Find the latest mtime we have for this repo to resume from where we left off
  const latest = await useDrizzle()
    .select({ mtime: sql<number>`max(${tables.issues.mtime})` })
    .from(tables.issues)
    .where(eq(tables.issues.repoId, repoId))
    .get()

  const since = latest?.mtime ? new Date(latest.mtime).toISOString() : undefined
  if (since) {
    console.log('resuming from', since, 'for', `${owner}/${name}`)
  }

  let indexed = 0
  let skipped = 0

  await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner: owner!,
    repo: name!,
    state: 'all',
    sort: 'updated',
    direction: 'asc',
    per_page: 100,
    ...(since ? { since } : {}),
  }, async (response) => {
    // Process each page in batches of 10 concurrent requests
    const issues = response.data
    for (let i = 0; i < issues.length; i += 10) {
      const batch = issues.slice(i, i + 10)
      const results = await Promise.allSettled(
        batch.map(issue => indexIssue(issue, { owner: { login: owner! }, name: name! })),
      )
      for (const r of results) {
        if (r.status === 'fulfilled') {
          if (r.value)
            indexed++
          else skipped++
        }
        else {
          console.error('Failed to index issue:', r.reason)
        }
      }
    }
    if (Number.parseInt(response.headers['x-ratelimit-remaining'] || '999') < 100) {
      console.info(Number.parseInt(response.headers['x-ratelimit-remaining']!), 'requests remaining')
    }
    return []
  })

  console.log('indexed', indexed, 'issues (skipped', skipped, ') from', `${owner}/${name}`)
}

async function deleteRepo(_event: H3Event, repo: InstallationRepo) {
  const [owner, name] = repo.full_name.split('/')

  await removeStoredEmbeddingsForRepo(owner!, name!)
  await removeMetadataForRepo(owner!, name!)
}
