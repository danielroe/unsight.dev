<script setup lang="ts">
import type { AsyncDataRequestStatus } from '#app'
import type { IssueMetadata } from '~~/shared/models/github-metadata'

interface SimilarIssuesViewProps {
    issues: IssueMetadata[];
    status: AsyncDataRequestStatus;
}
const { issues, status } = defineProps<SimilarIssuesViewProps>()

const { selectedView } = useSelectedView()
</script>

<template>
    <template v-if="status === 'idle' || status === 'pending'">
        <GitHubIssueSkeleton />
    </template>

    <template v-else>
        <template v-if="selectedView === 'PaperStack'">
            <PaperStackSimilarIssuesView :issues="issues" :isTruncated="false" />
        </template>

        <template v-else-if="selectedView === 'BookShelf'">
            <BookShelfSimilarIssuesView :issues="issues" :isTruncated="false" />
        </template>

        <template v-else-if="selectedView === 'WindowPane'" >
            <WindowPaneSimilarIssuesView :issues="issues" :isTruncated="false" />
        </template>
    </template>
</template>
 