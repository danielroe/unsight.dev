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

const formatter = new Intl.RelativeTimeFormat()

function formatDate (date: Date) {
  const diffInSeconds = (date.getTime() - Date.now()) / 1000
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit, value: number }> = [
    { unit: 'second', value: diffInSeconds },
    { unit: 'minute', value: diffInSeconds / 60 },
    { unit: 'hour', value: diffInSeconds / 3600 },
    { unit: 'day', value: diffInSeconds / 86400 },
    { unit: 'month', value: diffInSeconds / 2592000 },
    { unit: 'year', value: diffInSeconds / 31536000 },
  ]
  const { unit, value } = units.find(({ value }) => Math.abs(value) < 60) || units[units.length - 1]!
  return formatter.format(Math.round(value), unit)
}
</script>

<template>
  <div class="section w-full">
    <div class="px-2 text-xs flex flex-col gap-2 w-full">
      <h3 class="!text-xs">Related issues</h3>
      <div v-for="issue of issues">
        <a :href="issue.url" class="my-1 truncate block flex-row gap-1">
          <svg v-if="issue.state === 'open'" class="octicon octicon-issue-opened open" title="Open" aria-label="Open issue" viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path></svg>
          
          <svg v-else class="octicon octicon-issue-closed closed" title="Closed" aria-label="Closed issue" viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img" style="color: #a371f7;"><path d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path></svg>
          
          <span class="ml-2 !text-white">
            {{ issue.title }}
          </span>
          <br>
        </a>
        <a class="ml-4 hover:underline focus:underline" :href="`https://github.com/${issue.owner}/${issue.repository}`" >{{ issue.owner }}/{{ issue.repository }}</a>
        &middot;
        <span class="inline-flex flex-row gap-1">
          <span v-if="issue.state === 'closed'">closed</span>
          <span v-else>updated</span>
          <time :datetime="issue.updated_at" class="inline-flex flex-row gap-1">
            {{ formatDate(new Date(issue.updated_at)) }}
          </time>
        </span>
      </div>
      <span v-if="issues.length === 0" class="mt-1 mb-2">No similar issues found.</span>
    </div>
  </div>
</template>

<style scoped>
a {
  color: var(--fgColor-muted, var(--color-fg-muted, #848d97));
}
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
