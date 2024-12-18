<script setup lang="ts">
interface Issue {
  id: number
  dateTime: string
  title: string
  repository: string
  similarityPercentage: number
  description?: string
}

defineProps<{
  issue: Issue
}>()

function generateIssueUrl(issue: Issue): string {
  return new URL(`/${issue.repository}/issues/${issue.id}`, 'https://github.com').toString()
}

function generateUnsightDotDevUrl(issue: Issue): string {
  return new URL(`/${issue.repository}/issue/${issue.id}`, 'https://unsight.dev').toString()
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
        <a aria-current="page" :href="generateIssueUrl(issue)" class="no-underline hover:underline color-current">{{
          issue.repository }}</a>
        · updated <time :datetime="issue.dateTime">{{ issue.dateTime }}</time> · <a
          :href="generateUnsightDotDevUrl(issue)" class="no-underline hover:underline color-current"
        >{{
          issue.similarityPercentage }}% similar </a>
      </div>
      <div class="flex flex-row gap-1 items-baseline flex-wrap md:flex-nowrap" />
    </div>
  </article>
</template>
