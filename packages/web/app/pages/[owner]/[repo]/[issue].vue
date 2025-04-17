<script setup lang="ts">
const route = useRoute('owner-repo-issue')

useSeoMeta({
  title: () => `Similar issues - #${route.params.issue} - ${route.params.owner}/${route.params.repo}`
})


const { data: issues, status } = useFetchSimilar(route.params.owner, route.params.repo, route.params.issue)
</script>

<template>
  <section :style="{ '--section-index': 1 }">
      <SimilarIssuesViewLayout :issues="issues" :status="status" />
  </section>
</template>

<style scoped>
section:first-of-type {
  view-transition-name: var(--section-index);
}
</style>
