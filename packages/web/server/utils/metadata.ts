export interface InstallationRepo {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
}

export type RepoMetadata = InstallationRepo & {
  indexed: boolean | number
}

export const currentIndexVersion = 2

export async function getMetadataForRepo(owner: string, name: string) {
  const kv = hubKV()
  return kv.getItem<RepoMetadata>(`repo:${owner}:${name}`)
}

export async function setMetadataForRepo(owner: string, name: string, metadata: RepoMetadata) {
  const kv = hubKV()
  return kv.setItem(`repo:${owner}:${name}`, metadata)
}

export async function removeMetadataForRepo(owner: string, name: string) {
  const kv = hubKV()
  return kv.removeItem(`repo:${owner}:${name}`)
}
