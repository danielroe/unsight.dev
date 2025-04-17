<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewProps {
    cluster: ClusterMetadata;
    clusterTitle: string;
    clusterIndex: number;
    isTruncated: boolean;
}
const { cluster, clusterIndex, clusterTitle, isTruncated } = defineProps<ClusterViewProps>()

const NUMBER_OF_ISSUES = 9

const issuesStack = computed(() => {
    return (isTruncated) ?  cluster.issues.slice(0, NUMBER_OF_ISSUES) : cluster.issues
})
</script>

<template >
        <section
            class="w-full"
        >
            <WindowPaneClusterSummary 
                :clusterIndex="clusterIndex" 
                :clusterLength="cluster.issues.length" 
                :clusterTitle="clusterTitle"
            />

            <div class="grid grid-cols-3 grid-rows-3 gap-4 ">
                <div
                    v-for="(issue, index) of issuesStack"
                    :key="index"
                    class="h-30 overflow-hidden border-solid border-2 border-gray-700 rounded-md bg-shark-500 p-2 "
                >
                    <WindowPaneGithubIssue
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
