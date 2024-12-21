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

const VITE_UNSIGHT_DOT_DEV_BASE_URL = import.meta.env.VITE_UNSIGHT_DOT_DEV_BASE_URL || 'https://unsight.dev/'
const GITHUB_BASE_URL = 'https://github.com'

function generateIssueUrl(issue: Issue): string {
  return new URL(`/${issue.owner}/${issue.repository}/issues/${issue.number}`, GITHUB_BASE_URL).toString()
}

function generateUnsightDotDevUrl(issue: Issue): string {
  return new URL(`/${issue.owner}/${issue.repository}`, VITE_UNSIGHT_DOT_DEV_BASE_URL).toString()
}

function scoreAsPercentage(score: number): string {
  return (score * 100).toFixed(2)
}
</script>

<template>
  <article class="flex flex-row gap-2 leading-tightest">
    <span class="flex-shrink-0 inline-block w-5 h-5 i-tabler-circle-dot text-green-500" />
    <div class="flex flex-row gap-2 flex-wrap md:flex-nowrap md:pb-6 flex-grow">
      <a :href="generateIssueUrl(issue)" target="_blank" class="issue-link">
        <span class="sr-only">View issue:</span>
        {{ issue.title }}
      </a>
      <div class="text-xs relative md:absolute md:mt-6">
        <a
          aria-current="page" :href="generateUnsightDotDevUrl(issue)"
          class="no-underline hover:underline color-current"
        >
          {{ issue.repository }}
        </a>
        · updated
        <relative-time :datetime="issue.updated_at" />
        ·
        <a
          :href="generateUnsightDotDevUrl(issue)"
          class="no-underline hover:underline color-current"
        >
          {{ scoreAsPercentage(issue.score) }}% similar
        </a>
      </div>
    </div>
  </article>
</template>
