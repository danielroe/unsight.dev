<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'
import type { AsyncDataRequestStatus } from '#app'

interface RepoViewLayoutProps {
    clusters: ClusterMetadata[];
    status: AsyncDataRequestStatus;
}
const { clusters, status } = defineProps<RepoViewLayoutProps>()

const { selectedView } = useSelectedView()
</script>

<template>
    <template v-if="status === 'idle' || status === 'pending'">
        <div 
            v-for="i in 7"
            :key="i"
        >
            <GitHubIssueSkeleton />
        </div>
    </template>

    <template v-else-if="!clusters.length">
      <NoClustersView />
    </template>

    <template v-else>
        <template v-if="selectedView === 'PaperStack'">
            <div class="grid grid-cols-4 gap-4 pt-4">
                <PaperStackClusterLayout :clusters="clusters" />
            </div>
        </template>

        <template v-else-if="selectedView === 'BookShelf'">
            <div class="grid grid-cols-4 gap-4 pt-4">
                <BookShelfClusterLayout :clusters="clusters" />
            </div>
        </template>

        <template v-else-if="selectedView === 'WindowPane'" >
            <div class="grid grid-cols-3 gap-4 pt-4">
                <WindowPaneClusterLayout :clusters="clusters" />            
            </div>
        </template>
    </template>
</template>
 