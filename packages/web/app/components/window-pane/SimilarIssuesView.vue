<script setup lang="ts">
import type { IssueMetadata } from '~~/shared/models/github-metadata'

interface SimilarIssuesViewProps {
    issues: IssueMetadata[];    
}
const { issues } = defineProps<SimilarIssuesViewProps>()
</script>

<template >
        <section
            class="w-full "
        >
            <WindowPaneSimilarIssuesSummary 
                :issueTitle="issues[0]?.title || 'ISSUE TITLE MISSING'"
                :style="{
                    zIndex: issues.length + 1,
                }"
            />

            <div class="grid grid-cols-3 grid-rows-3 gap-4 ">
                <div
                    v-for="(issue, index) of issues"
                    :key="index"
                    :style="{
                        zIndex: issues.length - index,
                    }"
                    class="h-30 overflow-hidden border-solid border-2 border-gray-700 rounded-md bg-shark-500 p-2"
                >
                    <WindowPaneGithubIssue
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
            </div>
        </section>
</template>
