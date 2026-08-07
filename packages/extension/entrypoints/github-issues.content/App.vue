<script setup lang="ts">
import type { Issue } from '@/types'
import { onMounted, ref } from 'vue'
import RelatedIssueItem from '@/components/RelatedIssueItem.vue'

const { owner, repo, issue } = window.location.pathname.match(/\/(?<owner>[^/]+)\/(?<repo>[^/]+)\/issues\/(?<issue>\d+)/)?.groups || {}

const issues = ref<Issue[]>([])
const loading = ref(true)
const failed = ref(false)

onMounted(async () => {
  try {
    const url = new URL(`/api/similarity/${owner}/${repo}/${issue}`, 'https://unsight.dev/').toString()
    const response = await browser.runtime.sendMessage({ type: 'fetch-similar-issues', url })
    if (response?.error || !Array.isArray(response?.issues)) {
      throw new Error(response?.error || 'Unexpected response')
    }
    issues.value = response.issues
  }
  catch (err) {
    failed.value = true
    console.error('Failed to fetch similar issues:', err)
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="section w-full">
    <div class="px-2 text-xs flex flex-col gap-2 w-full">
      <h3 class="!text-xs text-[--fgColor-muted]">
        Related issues
      </h3>
      <span v-if="loading" class="mt-1 mb-2">Loading...</span>
      <span v-else-if="failed" class="mt-1 mb-2">Could not load similar issues.</span>
      <template v-else>
        <RelatedIssueItem v-for="(item, index) of issues" :key="index" :issue="item" />
        <span v-if="issues.length === 0" class="mt-1 mb-2">No similar issues found.</span>
      </template>
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
