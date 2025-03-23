export interface InstallationRepo {
  id: number
  node_id: string
  full_name: string
  private: boolean
}

export type RepoMetadata = InstallationRepo & {
  indexed: number
}

export const currentIndexVersion = 4

export async function getMetadataForRepo(owner: string, name: string) {
  const repo = await useDrizzle().select().from(tables.repos).where(eq(tables.repos.full_name, `${owner}/${name}`)).get()
  if (repo) {
    return {
      ...repo,
      private: !!repo.private,
    }
  }
}

export async function removeMetadataForRepo(owner: string, name: string) {
  await useDrizzle().delete(tables.repos).where(eq(tables.repos.full_name, `${owner}/${name}`))
}
