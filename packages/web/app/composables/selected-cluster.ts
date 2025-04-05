import type { ClusterMetadata } from '~~/shared/models/github-metadata'

const selectedCluster = ref<ClusterMetadata>()

export function useSelectedCluster() {
  const { data: clusters } = useNuxtData('clusters')

  const setSelectedCluster = (clusterIndex: number) => {
    selectedCluster.value = clusters.value[clusterIndex]
  }

  return {
    selectedCluster,
    setSelectedCluster,
  }
}
