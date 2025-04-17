<script setup lang="ts">
interface ClusterSummaryProps {
    clusterIndex: number;
    clusterLength: number;
    clusterTitle: string;
}
const { clusterIndex, clusterLength, clusterTitle } = defineProps<ClusterSummaryProps>()

const CLUSTER_ICON = 'cluster'
const CLUSTER_SUMMARY = 'Cluster Summary'
const ISSUES_IN_CLUSTER = ' issues in cluster'
</script>

<template >
    <section class="h-40 relative z-10 flex-col p-2 border-3 border-solid border-gray-600 rounded-md bg-shark-500">
        <div class="flex justify-between items-baseline gap-1 font-bold ">
            <div class="text-2xl flex items-baseline">
                <p class="text-gray-500 mr-1 font-normal">#</p>{{ clusterIndex + 1 }}
            </div>

            <div>
                <p class="text-lg text-gray-300 ">{{ CLUSTER_SUMMARY }}</p>
            </div>

            <div>
                <span class="text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 leading-tight flex items-center">
                    <SvgPaperStack class="w-4 h-4" />
                    {{ CLUSTER_ICON}}
                </span>
            </div>
        </div>
            
        <div class="text-lg color-gray-400 overflow-hidden text-wrap"> {{ clusterTitle }}</div>

        <div class="text-lg color-gray-400 overflow-hidden text-wrap"> {{  clusterLength + ISSUES_IN_CLUSTER }}</div>
    </section>
</template>
