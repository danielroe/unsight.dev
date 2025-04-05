
<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

const zIndex = ['z-8', 'z-6', 'z-4']

interface ClusterItemProps {
    clusters: ClusterMetadata[];
}

const { clusters } = defineProps<ClusterItemProps>()

// const openState = reactive<Record<string, boolean>>({})

// console.log('ClusterItemProps.clusters', clusters)

</script>

<template >
    <div class="grid grid-cols-4 gap-4 pt-4">
        <section 
            v-for="(cluster, index) of clusters" 
            :key="index"
            class="flex flex-col "
        >
            <PaperStackClusterSummary :clusterIndex="index" :clusterLength="cluster.issues.length || 0" :clusterTitle="cluster.title" />

            <div 
                v-for="(issue, idx) of cluster.issues.slice(0, 3)"
                class="h-20 p-2 p-r-none border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 whitespace-nowrap overflow-hidden text-ellipsis -mt-2"
                :class="zIndex[idx]"
            >
                <PaperStackGithubIssue
                    class="github-issues relative"
                    :key="idx"
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

            <div 
                class="h-10 p-2 border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 whitespace-nowrap overflow-hidden text-ellipsis -mt-2 z-2"
            >
                <PaperStackShowMoreIssues :cluster="cluster" :clusterIndex="index" :clusterLength="cluster.issues.length || 0" />
            </div>
        </section>
    </div>
</template>

<!-- TODO: Improve naive gradient approach -->
 <!-- .github-issues {
  mask-image: linear-gradient(to right, black 80%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
} -->
<style scoped>
.github-issues  {
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
}  
</style>
