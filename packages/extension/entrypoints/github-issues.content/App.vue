<script setup lang="ts">
import { useFetch } from '@vueuse/core'
import { computed } from 'vue'
import RelatedIssueItem from "@/components/RelatedIssueItem.vue";

const { owner, repo, issue } = window.location.pathname.match(/\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue>\d+)/)?.groups || {}

const issueUrl = computed(() => new URL(`/api/similarity/${owner}/${repo}/${issue}`, 'https://unsight.dev/').toString())

const { data: issues } = useFetch(issueUrl, {
  immediate: true,
  initialData: [],
  timeout: 5000,
  onFetchError: (ctx) => {
    console.error('Failed to fetch similar issues:', ctx.error)
    return ctx
  }
}).json()

</script>

<template>
  <div class="section w-full">
    <div class="px-2 text-xs flex flex-col gap-2 w-full">
      <h3 class="!text-xs text-[--fgColor-muted]">Related issues</h3>
      <RelatedIssueItem v-for="issue of issues " :issue="issue" />
      <span v-if="issues.length === 0" class="mt-1 mb-2">No similar issues found.</span>
    </div>
  </div>
</template>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding-top: 4px;
  margin-bottom: 16px;
  position: relative;
  width: 100%;
}
.section:after {
  content: "";
  position: absolute;
  height: 1px;
  bottom: -8px;
  left: 8px;
  background-color: var(--borderColor-muted, var(--color-border-muted, #21262d));
  width: calc(100% - 8px);
}
</style>
