<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterViewProps {
    cluster: ClusterMetadata;
    clusterTitle: string;
    clusterIndex: number;
    clusterLength?: number;
}

const { cluster, clusterIndex, clusterLength, clusterTitle } = defineProps<ClusterViewProps>()

const issuesStack = computed(() => {
    return (clusterLength) ? cluster.issues.slice(0, clusterLength) : cluster.issues
})

</script>

<!-- TODO: Find a solution other than z-index -->

<template >
        <section
            class="flex flex-col rounded-md border-solid border border-gray-700 columns-1 "
        >
            <PaperStackClusterSummary 
                :clusterIndex="clusterIndex" 
                :clusterLength="clusterLength || cluster.issues.length" 
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
                class="relative -mt-2 h-25 py-4 p-l-3 p-r-none border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 
                scrollbar scrollbar-rounded scrollbar-w-2 scrollbar-thumb-gray-500 scrollbar-track-gray-700 hover:scrollbar-thumb-gray-400"
            >
                <!-- TODO: Fix scrollbar styling -->
            <!-- class="h-20 p-2 p-r-none border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 whitespace-nowrap overflow-hidden text-ellipsis -mt-2" -->

                <PaperStackGithubIssue
                    class="issue-row relative"
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

<!-- TODO: Find a solution for gradient -->
<!-- TODO: whitespace-nowrap overflow-hidden text-ellipsis -->
<!-- TODO: Improve naive gradient approach -->
<!-- TODO: Need to split some of the behaviors between here and the ClusterLayout in order to get the correct width -->

<style scoped>
/* .issue-row {
    margin-top: -0.25rem; 
  position: relative;
   z-index: calc(var(--stack-index));
} */

/* .github-issues  {
  position: relative; 
  overflow: hidden;    
}

.github-issues::after {
  content: "";
  position: absolute;
  top: 0;
  right: 0;
  width: 5rem;         
  height: 100%;        
  background: linear-gradient(to right, rgba(255, 255, 255, 0), #6b7280); 
  pointer-events: none; 
}   */
</style>
