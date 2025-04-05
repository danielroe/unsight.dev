<script setup lang="ts">
interface ClusterSummaryProps {
    clusterIndex: number;
    clusterLength: number;
    clusterTitle: string;
}

const CLUSTER_ICON = 'cluster'
const CLUSTER_SUMMARY = 'Cluster Summary'
const TOTAL_ISSUES = 'Total number of issues: '

const { clusterIndex, clusterLength, clusterTitle } = defineProps<ClusterSummaryProps>()
</script>

<template >
    <section class="h-40 md:p-2 md:border-3 md:border-solid border-gray-600 md:rounded-md bg-shark-500 relative z-10">
        <div class="flex justify-between items-baseline gap-1">
            <div class="font-bold text-2xl flex items-baseline">
                <p class="text-gray-500 inline-block mr-1 font-normal">#</p>{{ clusterIndex + 1 }}
            </div>

            <div>
                <p class="text-lg text-gray-300 inline-block font-bold">{{ CLUSTER_SUMMARY }}</p>
            </div>

            <div>
                <span class="ml-auto text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 inline-block leading-tight flex items-center">
                    <SvgPaperStack class="inline-block w-4 h-4" />
                    {{ CLUSTER_ICON}}
                </span>
            </div>
        </div>
            
        <div class="text-lg color-gray-400 overflow-hidden text-wrap"> {{ clusterTitle }}</div>

        <div class="text-lg color-gray-400 overflow-hidden text-wrap"> {{ TOTAL_ISSUES + clusterLength }}</div>
    </section>
</template>
