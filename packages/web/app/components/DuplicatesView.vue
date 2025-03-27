
<script setup lang="ts">
import type { AsyncDataRequestStatus } from '#app'
import type { IssueMetadata } from '~~/shared/models/github-metadata'

interface DuplicatesrViewProps {
    duplicates: IssueMetadata[];
    status: AsyncDataRequestStatus;
}

const LOADING_DUPLICATES = 'loading duplicates'
const POSSIBLE_DUPLICATE = 'possible duplicate'

const { duplicates, status } = defineProps<DuplicatesrViewProps>()

const showDuplicates = ref(false)

const typedDuplicates = computed<IssueMetadata[]>(() => {
    return showDuplicates ? duplicates.value?.map(cluster => cluster) : []}
)
</script>

<template >
    <div
      v-if="status !== 'success' && status !== 'error'"
      class="mt-6 rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex items-center gap-2 justify-center pointer-events-none animate-pulse"
    >
      <span
        size="medium"
        class="text-gray-400 flex-shrink-0 i-tabler-refresh inline-block w-4 h-4 animate-spin"
      />
      {{ LOADING_DUPLICATES }}
    </div>

    <button
          v-else-if="!showDuplicates && duplicates.length"
          class="mt-6 rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex items-center gap-2 justify-center w-full"
          type="button"
          @click="showDuplicates = true"
      >
          show {{ duplicates?.length }} possible duplicates
      </button>  
  <template v-if="showDuplicates">
      <section
        v-for="(cluster, i) of typedDuplicates"
        class="flex flex-col gap-4 md:rounded-md md:border-solid md:border md:border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 flex-wrap border-b-solid"
      >
        <h2 class="my-4 font-bold text-2xl flex items-baseline">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
          <span>{{ i + 1 }}</span>
          <span class="ml-auto text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 inline-block leading-tight flex items-center">
            <span class="i-tabler-wash-dryclean-off inline-block w-4 h-4"></span>
            {{ POSSIBLE_DUPLICATE }}
          </span>
        </h2>
        <GitHubIssue
          v-for="(issue, j) of cluster"
          :key="j"
          :url="issue.url"
          :title="issue.title"
          :owner="issue.owner"
          :repository="issue.repository"
          :number="issue.number"
          :avg-similarity="issue.score"
          :labels="issue.labels"
          :updated_at="issue.updated_at"
        />
      </section>
  </template>
</template>
