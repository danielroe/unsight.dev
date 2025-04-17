<script setup lang="ts">
import type { IssueMetadata } from '~~/shared/models/github-metadata'

interface SimilarIssuesViewProps {
    issues: IssueMetadata[];    
}
const { issues } = defineProps<SimilarIssuesViewProps>()
</script>

<!-- TODO: Find a solution other than z-index -->

<template >
        <section
            class="flex flex-col rounded-md border-solid border border-gray-700 columns-1 "
        >
            <PaperStackSimilarIssuesSummary 
                :issueTitle="issues[0]?.title || 'ISSUE TITLE MISSING'"
                :style="{
                    zIndex: issues.length + 1,
                }"
            />

            <div
                v-for="(issue, index) of issues"
                :key="index"
                :style="{
                    zIndex: issues.length - index,
                }"
                class="h-30 overflow-hidden -mt-2 pt-3 pl-3 pr-none border-solid border-2 border-t-0 border-gray-700 rounded-t-none rounded-b-md bg-shark-500 "
            >
                <PaperStackGithubIssue
                    :key="index"
                    :url="issue.url"
                    :title="issue.title"
                    :owner="issue.owner"
                    :repository="issue.repository"
                    :number="issue.number"
                    :avg-similarity="1 - issue.score"
                    :labels="issue.labels"
                    :updated_at="issue.updated_at"
                />
            </div>
        </section>
</template>
