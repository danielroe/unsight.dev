<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewProps {
    cluster: ClusterMetadata;
    clusterIndex: number;
    isTruncated: boolean;
}
const { cluster, clusterIndex, isTruncated } = defineProps<ClusterViewProps>()

const NUMBER_OF_ISSUES = 3

const issuesStack = computed(() => {
    return (isTruncated) ?  cluster.issues.slice(0, NUMBER_OF_ISSUES) : cluster.issues
})
</script>

<!-- TODO: Find a solution other than z-index -->

<template >
        <section
            class="flex flex-col rounded-md border-solid border border-gray-700 columns-1 "
        >
            <PaperStackClusterSummary 
                :clusterIndex="clusterIndex" 
                :clusterLength="cluster.issues.length" 
                :clusterTitle="cluster.title"
                :style="{
                    zIndex: cluster.issues.length + 1,
                }"
            />

            <div
                v-for="(issue, index) of issuesStack"
                :style="{
                    zIndex: cluster.issues.length - index,
                }"
                class="h-30 overflow-hidden -mt-2 pt-3 pl-3 pr-none border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 "
            >
                <PaperStackGithubIssue
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
