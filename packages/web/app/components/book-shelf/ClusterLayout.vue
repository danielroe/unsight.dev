
<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterLayoutProps {
    clusters: ClusterMetadata[];
}

const { clusters } = defineProps<ClusterLayoutProps>()

</script>

<template >
    <section 
        v-for="(cluster, index) of clusters" 
        :key="index"
        class=" flex flex-col gap-4 justify-between p-4 rounded-md border-solid border border-gray-700 columns-1 border-b-solid"
    >
        <BookShelfClusterView :cluster="cluster" :clusterIndex="index" :clusterTitle="cluster.title" :isModal="false"/>

        <BookShelfClusterAction :cluster="cluster" :clusterIndex="index" :clusterLength="cluster.issues.length || 0" />
    </section>
</template>