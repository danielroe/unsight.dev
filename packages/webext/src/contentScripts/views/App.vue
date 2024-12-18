<script setup lang="ts">
import 'uno.css'
import SimilarIssue from '~/components/SimilarIssue.vue'

const issues = [
  { id: 1, repository: 'nickytonline/yoyo', title: 'First Issue', description: 'This is the first issue', similarityPercentage: 90, dateTime: '2021-10-01T00:00:00Z' },
  { id: 2, repository: 'bobbyt/amazer', title: 'Second Issue', description: 'This is the second issue', similarityPercentage: 80, dateTime: '2024-07-08T00:00:00Z' },
  { id: 3, repository: 'jam/booya', title: 'Third Issue', description: 'This is the third issue', similarityPercentage: 70, dateTime: '2024-12-10T00:00:00Z' },
]
</script>

<template>
  <details class="grid gap-2">
    <summary>Similar issues</summary>
    <SimilarIssue v-for="issue in issues" :key="issue.id" :issue="issue" />
  </details>
</template>
