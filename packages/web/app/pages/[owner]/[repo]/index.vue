<script setup lang="ts">
const OWNER_REPO = 'owner-repo'

const route = useRoute(OWNER_REPO)

useSeoMeta({
  title: () => `Issue clusters - ${route.params.owner}/${route.params.repo}`
})
</script>

<template>
  <RepoViewLayout>
    <template #console>
      <CommandConsole />
    </template>

    <template #duplicates>
      <DuplicatesView />
    </template>

    <template #clusters >
      <ClusterViewJunction />
    </template>
  </RepoViewLayout>
</template>
