<script setup lang="ts">
import { useFetch } from '@vueuse/core'
import 'uno.css'
import type { Issue } from '~/components/SimilarIssue.vue'
import SimilarIssue from '~/components/SimilarIssue.vue'

const API_BASE_URL = 'https://unsight.dev'

const [, ownerPart, repoPart, , issuePart] = window.location.pathname.split('/')

const issueUrl = computed(() => new URL(`/api/similarity/${ownerPart}/${repoPart}/${issuePart}`, API_BASE_URL).toString())

const { data: issues, status } = useFetch<Issue[]>(issueUrl).json()
</script>

<template>
  <details class="grid gap-2">
    <summary>Similar issues</summary>
    <div v-if="status === 'loading'">
      Loading...
    </div>
    <div v-else-if="status === 'error'" className="text-red-700">
      Error loading similar issues
    </div>
    <template v-else-if="issues">
      <SimilarIssue v-for="issue in issues" :key="issue.number" :issue="issue" />
    </template>
  </details>
</template>
