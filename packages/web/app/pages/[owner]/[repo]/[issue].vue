<script setup lang="ts">
const route = useRoute('owner-repo-issue')
const { data: issues, status } = useFetch(`/api/similarity/${route.params.owner}/${route.params.repo}/${route.params.issue}`, {
  baseURL: useRuntimeConfig().public.remote,
  default: () => [],
  transform: data => data.filter((i): i is NonNullable<typeof i> => !!(i && i.url)),
})
</script>

<template>
  <div>
    <section
      v-if="status === 'pending' || status === 'idle'"
      class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid animate-pulse"
      :style="{ '--section-index': 1 }"
    >
      <h2 class="flex items-center my-4 font-bold text-2xl">
        <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
        <span class="inline-block rounded-md h-5 bg-gray-500 w-5" />
      </h2>
      <GitHubIssueLoading
        v-for="s in Math.round(Math.random() * 4) + 1"
        :key="s"
      />
    </section>
    <section
      v-else
      class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid"
      :style="{ '--section-index': 1 }"
    >
      <h2 class="flex items-center my-4 font-bold text-2xl">
        <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
        {{ issues[0]?.title }}
      </h2>
      <GitHubIssue
        v-for="issue in issues"
        :key="issue.url"
        :url="issue.url"
        :title="issue.title"
        :owner="issue.owner"
        :repository="issue.repository"
        :number="issue.number"
        :avg-similarity="1 - issue.score"
        :labels="issue.labels"
        :updated_at="issue.updated_at"
      />
    </section>
  </div>
</template>

<style scoped>
section:first-of-type {
  view-transition-name: var(--section-index);
}
</style>
