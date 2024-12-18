<script setup lang="ts">
export interface Issue {
  owner: string
  repository: string
  number: number
  title: string
  url: string
  updated_at: string
  labels: string[]
  score: number
}

defineProps<{
  issue: Issue
}>()

function generateIssueUrl(issue: Issue): string {
  return new URL(`/${issue.owner}/${issue.repository}/issues/${issue.number}`, 'https://github.com').toString()
}

function generateUnsightDotDevUrl(issue: Issue): string {
  return new URL(`/${issue.owner}/${issue.repository}`, 'https://unsight.dev').toString()
}

function scoreAsPercentage(score: number): string {
  return (score * 100).toFixed(2)
}
</script>

<template>
  <article class="flex flex-row gap-2 leading-tightest">
    <span class="flex-shrink-0 inline-block w-5 h-5 i-tabler-circle-dot text-green-500" />
    <div class="flex flex-row gap-2 flex-wrap md:flex-nowrap md:pb-6 flex-grow">
      <a
        :href="generateIssueUrl(issue)" target="_blank"
        class="line-clamp-1 flex-grow text-sm md:text-base lg:flex-grow-0 no-underline color-current hover:underline"
      >{{
        issue.title
      }}</a>
      <div class="text-xs relative md:absolute md:mt-6 text-gray-400 mb-1">
        <a
          aria-current="page" :href="generateUnsightDotDevUrl(issue)"
          class="no-underline hover:underline color-current"
        >{{
          issue.repository }}</a>
        · updated
        <relative-time :datetime="issue.updated_at" /> · <a
          :href="generateUnsightDotDevUrl(issue)"
          class="no-underline hover:underline color-current"
        >{{
          scoreAsPercentage(issue.score) }}% similar </a>
      </div>
      <div class="flex flex-row gap-1 items-baseline flex-wrap md:flex-nowrap" />
    </div>
  </article>
</template>
