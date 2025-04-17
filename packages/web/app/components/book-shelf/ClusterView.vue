<script setup lang="ts">
import type { ClusterMetadata, IssueMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewProps {
    cluster: ClusterMetadata;
    clusterTitle: string;
    clusterIndex: number;
    isTruncated: boolean;
}
const { cluster, clusterIndex, clusterTitle, isTruncated } = defineProps<ClusterViewProps>()

const NUMBER_OF_ISSUES = 5

const issuesStack = computed(() => {
    return (isTruncated) ?  cluster.issues.slice(0, NUMBER_OF_ISSUES) : cluster.issues
})
</script>

<template >
        <section
            class="w-full"
        >
            <BookShelfClusterSummary 
                :clusterIndex="clusterIndex" 
                :clusterLength="cluster.issues.length" 
                :clusterTitle="clusterTitle"
            />

            <div class="flex flex-col gap-4 columns-1">
                <div
                    v-for="(issue, index) of issuesStack"
                    :key="index"
                    class="h-30 overflow-hidden border-solid border-2 border-gray-700 rounded-md bg-shark-500 p-2 "
                >
                    <BookShelfGithubIssue
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
            </div>
        </section>
</template>
