
<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterItemProps {
    clusters: ClusterMetadata[];
}

const { clusters } = defineProps<ClusterItemProps>()
</script>

<template >
    <section 
        v-for="(cluster, index) of clusters" 
        :key="index"
        class=" overflow-hidden flex flex-col gap-4 justify-between p-4 rounded-md border-solid border border-gray-700 columns-1 border-b-solid"
    >
        <WindowPaneClusterView :cluster="cluster" :clusterIndex="index" :clusterTitle="cluster.title" :isModal="false"/>

        <WindowPaneClusterAction :cluster="cluster" :clusterIndex="index" :clusterLength="cluster.issues.length || 0" />
    </section>
</template>
