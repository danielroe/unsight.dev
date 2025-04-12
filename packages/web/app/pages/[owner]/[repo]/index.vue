<script setup lang="ts">
const OWNER_REPO = 'owner-repo'

const route = useRoute(OWNER_REPO)

useSeoMeta({
  title: () => `Issue clusters - ${route.params.owner}/${route.params.repo}`
})

const { data: allowedRepos } = useFetchRepos()

const selectedRepo = useSelectedRepo(route.params.owner, route.params.repo)

const { data: clusters, refresh, status } = useFetchClusters(selectedRepo)

const { data: duplicates, status: duplicatesStatus } = useFetchDuplicates(selectedRepo)

const refreshClusters = () => refresh()
</script>

<template>
      <CommandConsole 
        :allowedRepos="allowedRepos" 
        :status="status" 
        :selectedRepo="selectedRepo" 
        v-model:refresh="refreshClusters"
      />

      <DuplicatesView 
        :duplicates="duplicates" 
        :status="duplicatesStatus" 
      />
   
      <RepoViewLayout 
        :clusters="clusters" 
        :status="status" 
      />
</template>
