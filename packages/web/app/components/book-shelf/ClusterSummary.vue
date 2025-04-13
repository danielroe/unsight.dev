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
    <section class="h-30 bg-transparent">
        <div class="flex justify-between items-baseline gap-1 font-bold ">
            <div class="text-2xl flex items-baseline">
                <p class="text-gray-500 mr-1 font-normal">#</p>{{ clusterIndex + 1 }}
            </div>

            <div>
                <p class="text-lg text-gray-300 ">{{ CLUSTER_SUMMARY }}</p>
            </div>

            <div>
                <span class="flex px-2 py-0.5 leading-tight items-center text-white bg-gray-700 text-sm font-normal rounded-full whitespace-pre border-solid border-1 border-gray-700 ">
                    <SvgBookShelf class=" w-4 h-4" />
                    {{ CLUSTER_ICON}}
                </span>
            </div>
        </div>
            
        <div class="text-lg color-gray-400 overflow-hidden text-wrap"> {{ clusterTitle }}</div>

        <div class="text-lg color-gray-400 overflow-hidden text-wrap"> {{ TOTAL_ISSUES + clusterLength }}</div>
    </section>
</template>
