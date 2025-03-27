<script setup lang="ts">
import type { AsyncDataRequestStatus } from '#app'
import type { RepoMetadata } from '~~/shared/models/github-metadata'

interface CommandConsoleProps {
  allowedRepos: RepoMetadata[];
  status: AsyncDataRequestStatus;
  selectedRepo: string;
}

const OWNER_REPO = 'owner-repo'
const REFRESH_DATA = 'refresh data'
const PICK_A_REPOSITORY = 'pick a repository to cluster issues'

const { allowedRepos, status, selectedRepo } = defineProps<CommandConsoleProps>()

const refresh = defineModel<() => Promise<void>>('refresh', {
    required: true
})

function navigateToRepo(event: Event) {
  const [owner, repo] = (event.target as HTMLSelectElement).value.split('/') as [string, string]
  return navigateTo({
    name: OWNER_REPO,
    params: { owner, repo },
  })
}
</script>

<template>
    <section class="w-full flex gap-2 justify-between justify-center items-center border-solid border border-gray-700 p-2 rounded-md">

    <form class="flex gap-2  items-center" @submit.prevent="() => refresh()" >
      <div class="flex gap-2 items-center">
        <h2 class="text-base my-3 font-normal">
          {{ selectedRepo }}
        </h2>
        <button
          class="rounded-full w-7 h-7 flex items-center justify-center border-solid border border-gray-700 bg-transparent color-gray-400 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex-shrink-0"
          :class="{ 'animate-spin opacity-50 pointer-events-none': status === 'pending' || status === 'idle' }"
          type="submit"
        >
          <span
            size="medium"
            class="text-gray-400 flex-shrink-0 i-tabler-refresh inline-block w-4 h-4"
          />
          <span class="sr-only">{{ REFRESH_DATA }}</span>
        </button>
      </div>
      <label class="w-full text-xs border-solid border border-gray-600 rounded-md flex flex-row items-center relative">
        <span class="sr-only">{{ PICK_A_REPOSITORY }}</span>
        <select
          :value="selectedRepo"
          class="pl-8 bg-shark-500 rounded-md pr-2 py-2 color-white border-0 w-full appearance-none"
          @change="navigateToRepo"
        >
          <option
            v-for="repo in allowedRepos.filter((repo: RepoMetadata) => repo.issuesIndexed > 0)"
            :key="repo.repo"
            :selected="repo.repo === selectedRepo"
          >
            {{ repo.repo }}
          </option>
        </select>
        <span
          class="absolute ml-2 text-gray-400 flex-shrink-0 i-tabler-search inline-block w-5 h-5"
        />
      </label>
    </form>

    <ViewToggle />
  </section>
</template>
