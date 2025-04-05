<script setup lang="ts">
const OWNER_REPO = 'owner-repo'

const route = useRoute(OWNER_REPO)

useSeoMeta({
  title: () => `Issue clusters - ${route.params.owner}/${route.params.repo}`
})

const { data: allowedRepos } = useFetchRepos()

//  TODO: useNuxtData() here or somewhere
//  TODO: wrap it in a composable


const selectedRepo = useSelectedRepo(route.params.owner, route.params.repo)

const { data: clusters, refresh, status } = useFetchClusters(selectedRepo)

const { data: duplicates, status: duplicatesStatus } = useFetchDuplicates(selectedRepo)

const refreshClusters = () => refresh()
</script>

<template>
  <RepoViewLayout>
    <template #console>
      <CommandConsole 
        :allowedRepos="allowedRepos" 
        :status="status" 
        :selectedRepo="selectedRepo" 
        v-model:refresh="refreshClusters"
      />
    </template>

    <template #duplicates>
      <DuplicatesView 
        :duplicates="duplicates" 
        :status="duplicatesStatus" 
      />
    </template>

    <template #clusters >
      <ClusterViewJunction 
        :clusters="clusters" 
        :status="status" 
      />
    </template>
  </RepoViewLayout>
</template>
