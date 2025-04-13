<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewProps {
    cluster: ClusterMetadata;
    clusterTitle: string;
    clusterIndex: number;
    isModal: boolean;
}

const NUMBER_OF_ISSUES = 3

const { cluster, clusterIndex, clusterTitle, isModal } = defineProps<ClusterViewProps>()

const issuesStack = computed(() => {
    return (isModal) ? cluster.issues : cluster.issues.slice(0, NUMBER_OF_ISSUES)
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
                :clusterTitle="clusterTitle"
                :style="{
                    zIndex: cluster.issues.length + 1,
                }"
            />

            <div
                v-for="(issue, index) of issuesStack"
                :key="index"
                :style="{
                    zIndex: cluster.issues.length - index,
                }"
                class="overflow-hidden -mt-2 h-25 py-4 p-l-3 p-r-none border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 "
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
