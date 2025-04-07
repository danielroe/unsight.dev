
<script setup lang="ts">
import type { ClusterMetadata } from '~~/shared/models/github-metadata'

interface ClusterItemProps {
    clusters: ClusterMetadata[];
}

const { clusters } = defineProps<ClusterItemProps>()

const openState = reactive<Record<string, boolean>>({})

</script>

<template >
        <section
        v-for="(cluster, c) of clusters"
        :key="c"
        class=" overflow-hidden flex flex-col gap-4 md:rounded-md md:border-solid md:border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid"
        >
            <h2 class=" my-4 font-bold text-2xl flex items-baseline">
                <span class="text-gray-500 inline-block mr-1 font-normal">#</span>{{ c + 1 }}
                <span class="ml-2 font-normal text-lg color-gray-300">&mdash; {{ cluster.title }}</span>
                <span class="ml-auto text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 inline-block leading-tight flex items-center">
                <span class="i-tabler:copy inline-block w-4 h-4"></span>
                cluster
                </span>
            </h2>
            <GitHubIssue
                v-for="(issue, i) of openState[c] !== true ? cluster.issues?.slice(0, 5) : cluster.issues"
                :key="i"
                :url="issue.url"
                :title="issue.title"
                :owner="issue.owner"
                :repository="issue.repository"
                :number="issue.number"
                :avg-similarity="issue.avgSimilarity"
                :labels="issue.labels"
                :updated_at="issue.updated_at"
            />
            <button
                v-if="cluster.issues?.length > 5 && openState[c] !== true"
                class="rounded-md text-sm border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
                type="button"
                @click="openState[c] = !openState[c]"
            >
                show {{ cluster.issues?.length - 3 }} more
            </button>
        </section>
</template>

<style scoped>

</style>
