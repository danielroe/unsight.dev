<template>
  <div>
    <a :href="issue.url" class="my-1 truncate block flex-row gap-1 gap-2">
      <svg v-if="issue.state === 'open'" class="octicon octicon-issue-opened open" title="Open" aria-label="Open issue"
           viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img">
        <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"></path>
        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"></path>
      </svg>

      <svg v-else class="octicon octicon-issue-closed closed" title="Closed" aria-label="Closed issue"
           viewBox="0 0 16 16" version="1.1" width="16" height="16" role="img" style="color: #a371f7;">
        <path
            d="M11.28 6.78a.75.75 0 0 0-1.06-1.06L7.25 8.69 5.78 7.22a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l3.5-3.5Z"></path>
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0Zm-1.5 0a6.5 6.5 0 1 0-13 0 6.5 6.5 0 0 0 13 0Z"></path>
      </svg>

      <RelatedIssueTitle class="ml-2 !text-white" :text="issue.title"></RelatedIssueTitle>
      <br>
    </a>
    <a class="ml-4 hover:underline focus:underline" :href="issue.url.split('/issues/')[0]">{{
        issue.owner
      }}/{{ issue.repository }}</a>
    &middot;
    <span class="inline-flex flex-row gap-1">
          <span v-if="issue.state === 'closed'">closed</span>
          <span v-else>updated</span>
          <time :datetime="issue.updated_at" class="inline-flex flex-row gap-1">
            {{ formatDate(new Date(issue.updated_at)) }}
          </time>
        </span>
  </div>
</template>

<script setup lang="ts">
import {Issue} from "@/types";
import RelatedIssueTitle from "@/components/RelatedIssueTitle.vue";

defineProps<{
  issue: Issue
}>()

const formatter = new Intl.RelativeTimeFormat()

function formatDate(date: Date) {
  const diffInSeconds = (date.getTime() - Date.now()) / 1000
  const units: Array<{ unit: Intl.RelativeTimeFormatUnit, value: number }> = [
    {unit: 'second', value: diffInSeconds},
    {unit: 'minute', value: diffInSeconds / 60},
    {unit: 'hour', value: diffInSeconds / 3600},
    {unit: 'day', value: diffInSeconds / 86400},
    {unit: 'month', value: diffInSeconds / 2592000},
    {unit: 'year', value: diffInSeconds / 31536000},
  ]
  const {unit, value} = units.find(({value}) => Math.abs(value) < 60) || units[units.length - 1]!
  return formatter.format(Math.round(value), unit)
}

</script>

<style scoped>
a {
  color: var(--fgColor-muted, var(--color-fg-muted, #848d97));
  max-width: fit-content;
}
</style>