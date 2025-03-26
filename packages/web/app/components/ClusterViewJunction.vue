<script setup lang="ts">
const OWNER_REPO = 'owner-repo'

const route = useRoute(OWNER_REPO)

const { selectedRepo } = useSelectedRepo(route.params.owner, route.params.repo)

const { data: clusters, status } = useFetchClusters(selectedRepo)

const { selectedView } = useToggleViewState()
</script>

<template>
    <template v-if="status === 'idle' || status === 'pending'">
      <GitHubIssueSkeleton />
    </template>

    <template v-else-if="!clusters.length">
      <NoClustersView />
    </template>

    <template v-else>
        <template v-if="selectedView === 'PaperStack'">
            <PaperStackClusterItem :clusters="clusters" />
        </template>

        <template v-if="selectedView === 'GridCell'" >
            <GridCellClusterItem :clusters="clusters" />            
        </template>

        <template v-if="selectedView === 'ColumnCell'">
            <ColumnCellClusterItem :clusters="clusters" />
        </template>
    </template>
</template>
 