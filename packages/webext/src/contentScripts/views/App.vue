<script setup lang="ts">
import type { Issue } from '~/components/SimilarIssue.vue'
import { useFetch } from '@vueuse/core'
import SimilarIssue from '~/components/SimilarIssue.vue'
import 'uno.css'

const VITE_UNSIGHT_DOT_DEV_BASE_URL = import.meta.env.VITE_UNSIGHT_DOT_DEV_BASE_URL || 'https://unsight.dev/'

const [, ownerPart, repoPart, , issuePart] = window.location.pathname.split('/')

const issueUrl = computed(() => new URL(`/api/similarity/${ownerPart}/${repoPart}/${issuePart}`, VITE_UNSIGHT_DOT_DEV_BASE_URL).toString())

const { 
  data: issues, 
  error, 
  isFetching,
} = useFetch<Issue[]>(issueUrl, {
  immediate: true,
  timeout: 5000,
  onFetchError: (ctx) => {
    console.error('Failed to fetch similar issues:', ctx.error)
    return ctx
  }
}).json()
</script>

<template>
  <details class="grid gap-2" aria-live="polite">
    <summary>Similar issues</summary>
    <div v-if="isFetching">
      Loading...
    </div>
    <div v-else-if="error" class="text-red-700">
      Error loading similar issues
    </div>
    <template v-else-if="issues">
      <p v-if="issues.length === 0">
        No similar issues
      </p>
      <ul v-else class="list-none grid gap-4" style="padding-inline-start: 0;">
        <li v-for="issue in issues" :key="issue.number">
          <SimilarIssue :issue="issue" />
        </li>
      </ul>
    </template>
  </details>
</template>
