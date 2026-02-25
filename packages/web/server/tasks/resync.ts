import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'
import { defineTask } from 'nitropack/runtime'

export default defineTask({
  meta: {
    name: 'resync',
    description: 'Discover all installed repos and trigger a full re-index',
  },
  async run() {
    const config = useRuntimeConfig()
    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: config.github.appId,
        privateKey: config.github.privateKey,
      },
    })

    // List all installations of the GitHub App
    const installations = await appOctokit.paginate(appOctokit.rest.apps.listInstallations, {
      per_page: 100,
    })
    console.log(`Found ${installations.length} installations`)

    const added: string[] = []
    const drizzle = useDrizzle()

    for (const installation of installations) {
      // Create per-installation Octokit
      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: config.github.appId,
          privateKey: config.github.privateKey,
          installationId: installation.id,
        },
      })

      // List all repos accessible to this installation
      const repos = await octokit.paginate(octokit.rest.apps.listReposAccessibleToInstallation, {
        per_page: 100,
      })

      for (const repo of repos) {
        if (repo.private)
          continue

        await drizzle.insert(tables.repos).values({
          full_name: repo.full_name.toLowerCase(),
          id: repo.id,
          node_id: repo.node_id,
          private: +repo.private,
          indexed: 0,
        }).onConflictDoNothing()

        added.push(repo.full_name)
      }
    }

    console.log(`Added/confirmed ${added.length} repos: ${added.join(', ')}`)

    // Reset all repos to unindexed so index-repo will pick them up
    await drizzle.update(tables.repos).set({ indexed: 0 })

    // Trigger indexing
    const result = await runTask('index-repo', { payload: {} })

    return {
      result: `Resynced ${added.length} repos. ${(result as { result?: string })?.result || ''}`,
    }
  },
})
