<script setup lang="ts">
    interface ShowMoreIssuesProps {
        clusterIndex: number;
        clusterLength: number;
    }

    const { clusterIndex, clusterLength } = defineProps<ShowMoreIssuesProps>()

    // TODO: Modify this to be open the cluster view
    const openState = defineModel<Record<string, boolean>>('openState', {
        required: true
    })

    const NO_MORE_ISSUES = 'No More Issues...'
</script>

<template >
    <div class="grid grid-cols-4 gap-4" >
        <!-- TODO: Needs to launch the popover/route/whatever to the ClusterView -->
        <button
            v-if="clusterLength > 3 && openState[clusterIndex] !== true"
            class=" text-sm bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
            type="button"
        >
            show {{ clusterLength - 3 }} more issues...
        </button>
        <!-- TODO: Improve the alternate state for the show more button -->
        <div v-else>{{ NO_MORE_ISSUES}}</div>
    </div>
</template>
