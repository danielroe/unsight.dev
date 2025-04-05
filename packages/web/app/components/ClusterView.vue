<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewProps {
    cluster: ClusterMetadata;
    clusterIndex: number;
}

const { cluster, clusterIndex } = defineProps<ClusterViewProps>()

const { data: clusters } = useNuxtData('clusters')

const clus = clusters.value[clusterIndex]

</script>

<!-- TODO: Props or useNuxtData to access correct cluster? -->
<!-- TODO: Convert these ClusterView fields into slots in order to pass the issues from PaperStackClusterItem directly into them -->
<template >
        <section
            class=" overflow-hidden flex flex-col md:rounded-md md:border-solid md:border border-gray-700 md:p-8 columns-1 lg:columns-2 border-b-solid"
        >
            <PaperStackClusterSummary :clusterIndex="clusterIndex" :clusterLength="cluster.issues.length || 0" :clusterTitle="cluster.title" />

            <div
                v-for="(issue, index) of clus.issues"
                :key="index"
                class="issue-row h-24 p-3 p-r-none border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 whitespace-nowrap overflow-hidden text-ellipsis"
            >
                <PaperStackGithubIssue
                    class=""
                    :key="index"
                    :url="issue.url"
                    :title="issue.title"
                    :owner="issue.owner"
                    :repository="issue.repository"
                    :number="issue.number"
                    :avg-similarity="issue.avgSimilarity"
                    :labels="issue.labels"
                    :updated_at="issue.updated_at"
                />
            </div>
        </section>
</template>

<style scoped>
.issue-row {
  /* position: relative; */
  /* z-index: calc(var(--stack-index)); */
}
</style>
