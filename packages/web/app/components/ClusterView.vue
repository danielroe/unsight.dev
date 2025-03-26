<script setup lang="ts">
    import type { IssueMetadata } from '~~/shared/models/github-metadata'

    interface ClusterViewProps {
        cluster: IssueMetadata;
    }

    const { cluster } = defineProps<ClusterViewProps>()
</script>

<template >
    <div class="border-solid border-2 border-gray-700 rounded-md p-2" >
        {{ cluster }}
    </div>
</template>
