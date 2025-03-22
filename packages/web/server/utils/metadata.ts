export interface InstallationRepo {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
}

export type RepoMetadata = InstallationRepo & {
  indexed: number
}

export const currentIndexVersion = 3

export async function getMetadataForRepo(owner: string, name: string) {
  const repo = await useDrizzle().select().from(tables.repos).where(eq(tables.repos.full_name, `${owner}/${name}`)).get()
  if (repo) {
    return {
      ...repo,
      private: !!repo.private,
    }
  }
}

export async function setMetadataForRepo(metadata: RepoMetadata) {
  await useDrizzle().insert(tables.repos).values({
    full_name: metadata.full_name,
    id: metadata.id,
    node_id: metadata.node_id,
    name: metadata.name,
    private: +metadata.private,
    indexed: metadata.indexed || 0,
  }).execute()
}

export async function removeMetadataForRepo(owner: string, name: string) {
  await useDrizzle().delete(tables.repos).where(eq(tables.repos.full_name, `${owner}/${name}`)).execute()
}
