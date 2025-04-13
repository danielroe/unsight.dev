<script setup lang="ts">
import type { AsyncDataRequestStatus } from '#app'
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewJunctionProps {
    clusters: ClusterMetadata[];
    status: AsyncDataRequestStatus;
}

const { selectedView } = useSelectedView()

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
        <div class="grid grid-cols-4 gap-4 pt-4">
            <template v-if="selectedView === 'PaperStack'">
                <PaperStackClusterLayout :clusters="clusters" />
            </template>
        </div>

        <div class="grid grid-cols-3 gap-4 pt-4">
            <template v-if="selectedView === 'WindowPane'" >
                <WindowPaneClusterLayout :clusters="clusters" />            
            </template>
        </div>

        <div class="grid grid-cols-4 gap-4 pt-4">
            <template v-if="selectedView === 'BookShelf'">
                <BookShelfClusterItem :clusters="clusters" />
            </template>
        </div>
    </template>
</template>
 