
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
    >
        <PaperStackClusterView :cluster="cluster" :clusterIndex="index" :clusterTitle="cluster.title" :isModal="false"/>

        <PaperStackClusterAction :cluster="cluster" :clusterIndex="index" :clusterLength="cluster.issues.length || 0" />
    </section>
</template>