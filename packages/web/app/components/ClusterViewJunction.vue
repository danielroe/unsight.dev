<script setup lang="ts">
import type { AsyncDataRequestStatus } from '#app'
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewJunctionProps {
    clusters: ClusterMetadata[];
    status: AsyncDataRequestStatus;
}

const { selectedView } = useToggleViewState()

const { clusters, status } = defineProps<ClusterViewJunctionProps>()
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
 