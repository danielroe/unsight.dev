<script setup lang="ts">
import { useFetch } from '@vueuse/core'
import { computed } from 'vue'

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
  <div class="section flex w-full">
    <div class="px-2 text-xs flex flex-col gap-2 w-full">
      <h3 class="!text-xs">Related issues</h3>
      <span v-for="issue of issues" class="my-1">
        <a :href="issue.url" class="truncate !text-white">
          <svg class="octicon octicon-issue-opened open" title="Open" aria-label="Open issue" viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>
          {{ issue.title }}
        </a>
      </span>
      <span v-if="issues.length === 0" class="mt-1 mb-2">No similar issues found.</span>
    </div>
  </div>
</template>

<style scoped>
div {
  color: var(--fgColor-muted, var(--color-fg-muted, #848d97));
}
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

a {
  max-width: fit-content;
}
</style>
