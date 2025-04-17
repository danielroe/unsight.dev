
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
    >
        <PaperStackClusterView :cluster="cluster" :clusterIndex="index" :clusterTitle="cluster.title" :isTruncated="true"/>

        <PaperStackClusterAction :cluster="cluster" :clusterIndex="index" :clusterLength="cluster.issues.length || 0" />
    </section>
</template>