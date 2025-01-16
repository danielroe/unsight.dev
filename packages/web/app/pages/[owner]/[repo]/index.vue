<script setup lang="ts">
const { data: allowedRepos } = useRepos()

const route = useRoute('owner-repo')
const selectedRepo = computed(() => route.params.owner && route.params.repo ? `${route.params.owner}/${route.params.repo}` as 'nuxt/nuxt' : 'nuxt/nuxt')

const { data: clusters, refresh, status } = useFetch(() => `/api/clusters/${selectedRepo.value}`, {
  baseURL: useRuntimeConfig().public.remote,
  default: () => [],
})

const showDuplicates = ref(false)
const { data: duplicates, status: duplicateStatus } = useFetch(() => `/api/duplicates/${selectedRepo.value}`, {
  baseURL: useRuntimeConfig().public.remote,
  default: () => [],
})

onMounted(async () => {
  if ('startViewTransition' in document) {
    let finishTransition: () => void
    const promise = new Promise<void>((resolve) => {
      finishTransition = resolve
    })
    watch(clusters, () => document.startViewTransition(() => promise), { flush: 'pre' })
    watch(clusters, () => nextTick(finishTransition), { flush: 'post' })
  }
})

function navigateToRepo(event: Event) {
  const [owner, repo] = (event.target as HTMLSelectElement).value.split('/') as [string, string]
  return navigateTo({
    name: 'owner-repo',
    params: { owner, repo },
  })
}

const openState = reactive<Record<string, boolean>>({})

const title = ref('unsight.dev')

useSeoMeta({
  title,
  titleTemplate: (pageTitle) => {
    return pageTitle ? `${pageTitle} - Repository Page for ${route.params.owner}/${route.params.repo}` : 'unsight.dev'
  },
  description: 'Detect duplicate GitHub issues, areas of concern and more across related repositories',
})
</script>

<template>
  <div>
    <form @submit.prevent="() => refresh()">
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
          <span class="sr-only">refresh data</span>
        </button>
      </div>
      <label class="w-full text-xs border-solid border border-gray-600 rounded-md flex flex-row items-center relative">
        <span class="sr-only">pick a repository to cluster issues</span>
        <select
          :value="selectedRepo"
          class="pl-8 bg-shark-500 pr-2 py-2 color-white border-0 w-full"
          @change="navigateToRepo"
        >
          <option
            v-for="repo in allowedRepos.filter((repo) => repo.issuesIndexed > 0)"
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
    <div
      v-if="duplicateStatus !== 'success' && duplicateStatus !== 'error'"
      class="mt-6 rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex items-center gap-2 justify-center pointer-events-none animate-pulse"
    >
      <span
        size="medium"
        class="text-gray-400 flex-shrink-0 i-tabler-refresh inline-block w-4 h-4 animate-spin"
      />
      loading duplicates
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
        v-for="(cluster, i) of showDuplicates ? duplicates : []"
        class="flex flex-col gap-4 md:rounded-md md:border-solid md:border md:border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 flex-wrap border-b-solid"
      >
        <h2 class="my-4 font-bold text-2xl flex items-baseline">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
          <span>{{ i + 1 }}</span>
          <span class="ml-auto text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 inline-block leading-tight flex items-center">
            <span class="i-tabler-wash-dryclean-off inline-block w-4 h-4"></span>
            possible duplicate
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
    <template v-if="status === 'idle' || status === 'pending'">
      <section
        v-for="i in 7"
        :key="i"
        :style="{ '--section-index': i }"
        class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid animate-pulse"
      >
        <h2 class="flex items-center my-4 font-bold text-2xl">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
          <span class="inline-block rounded-md h-5 bg-gray-500 w-5" />
        </h2>
        <GitHubIssueLoading
          v-for="s in Math.round(Math.random() * 3) + 1"
          :key="s"
        />
      </section>
    </template>
    <template v-else-if="!clusters.length">
      <section
        class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid"
      >
        <h2 class="flex items-center my-4 font-bold text-2xl">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
        </h2>
        <p class="flex flex-row gap-2 leading-tightest">
          <span
            class="flex-shrink-0 text-gray-400 i-tabler-alert-triangle inline-block w-5 h-5"
          />
          no clusters could be identified
        </p>
      </section>
    </template>
    <template v-else>
      <section
        v-for="(cluster, c) of clusters"
        :key="c"
        :style="{ '--section-index': c }"
        class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid"
      >
        <h2 class="my-4 font-bold text-2xl flex items-baseline">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>{{ c + 1 }}
          <span class="ml-auto text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 inline-block leading-tight flex items-center">
            <span class="i-tabler:copy inline-block w-4 h-4"></span>
            cluster
          </span>
        </h2>
        <GitHubIssue
          v-for="(issue, i) of openState[c] !== true ? cluster.slice(0, 5) : cluster"
          :key="i"
          :url="issue.url"
          :title="issue.title"
          :owner="issue.owner"
          :repository="issue.repository"
          :number="issue.number"
          :avg-similarity="issue.avgSimilarity"
          :labels="issue.labels"
          :updated_at="issue.updated_at"
        />
        <button
          v-if="cluster.length > 5 && openState[c] !== true"
          class="rounded-md text-sm border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
          type="button"
          @click="openState[c] = !openState[c]"
        >
          show {{ cluster.length - 5 }} more
        </button>
      </section>
    </template>
  </div>
</template>

<style scoped>
section:first-of-type {
  view-transition-name: var(--section-index);
}
</style>
