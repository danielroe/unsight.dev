<script setup lang="ts">
const route = useRoute('owner-repo')

useSeoMeta({
  title: () => `Issue clusters - ${route.params.owner}/${route.params.repo}`,
})

const { data: allowedRepos } = useRepos()

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

const unsub = [] as Array<() => void>
onMounted(async () => {
  if ('startViewTransition' in document) {
    let finishTransition: () => void
    const promise = new Promise<void>((resolve) => {
      finishTransition = resolve
    })
    unsub.push(watch(clusters, () => document.startViewTransition(() => promise), { flush: 'pre' }))
    unsub.push(watch(clusters, () => nextTick(finishTransition), { flush: 'post' }))
  }
})

onBeforeUnmount(() => {
  unsub.forEach(unsub => unsub())
})

function navigateToRepo(value: string) {
  const [owner, repo] = value.split('/') as [string, string]
  return navigateTo({
    name: 'owner-repo',
    params: { owner, repo },
  })
}
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
      <SelectRoot
        :model-value="selectedRepo"
        @update:model-value="navigateToRepo"
      >
        <SelectTrigger
          class="w-full text-xs border-solid border border-gray-600 rounded-md flex flex-row items-center px-3 py-2 bg-shark-500 color-white gap-2"
          aria-label="pick a repository to cluster issues"
        >
          <span class="text-gray-400 flex-shrink-0 i-tabler-search inline-block w-5 h-5" />
          <SelectValue placeholder="pick a repository" />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent
            class="bg-shark-400 border-solid border border-gray-600 rounded-md overflow-hidden z-50"
            position="popper"
            :side-offset="4"
          >
            <SelectViewport class="p-1">
              <SelectItem
                v-for="repo in allowedRepos.filter((r) => r.issuesIndexed > 0)"
                :key="repo.repo"
                :value="repo.repo"
                class="text-xs color-white px-3 py-2 rounded cursor-pointer outline-none data-[highlighted]:bg-shark-300"
              >
                <SelectItemText>{{ repo.repo }}</SelectItemText>
              </SelectItem>
            </SelectViewport>
          </SelectContent>
        </SelectPortal>
      </SelectRoot>
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
    <CollapsibleRoot
      v-else-if="duplicates.length"
      v-model:open="showDuplicates"
      class="mt-6"
    >
      <CollapsibleTrigger
        class="rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex items-center gap-2 justify-center w-full"
      >
        {{ showDuplicates ? 'hide' : 'show' }} {{ duplicates?.length }} possible duplicates
      </CollapsibleTrigger>
      <CollapsibleContent>
        <section
          v-for="(cluster, i) of duplicates"
          :key="i"
          class="flex flex-col gap-4 md:rounded-md md:border-solid md:border md:border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 flex-wrap border-b-solid"
        >
          <h2 class="my-4 font-bold text-2xl flex items-baseline">
            <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
            <span>{{ i + 1 }}</span>
            <span class="ml-auto text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 inline-block leading-tight flex items-center">
              <span class="i-tabler-wash-dryclean-off inline-block w-4 h-4" />
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
            :state="issue.state"
          />
        </section>
      </CollapsibleContent>
    </CollapsibleRoot>
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
        class="flex flex-col gap-4 md:rounded-md md:border-solid md:border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid"
      >
        <h2 class="my-4 font-bold text-2xl flex items-baseline">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>{{ c + 1 }}
          <span class="ml-2 font-normal text-lg color-gray-300">&mdash; {{ cluster.title }}</span>
          <span class="ml-auto text-white bg-gray-700 text-sm font-normal rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 border-gray-700 inline-block leading-tight flex items-center">
            <span class="i-tabler:copy inline-block w-4 h-4" />
            cluster
          </span>
        </h2>
        <GitHubIssue
          v-for="(issue, i) of cluster.issues.slice(0, 5)"
          :key="i"
          :url="issue.url"
          :title="issue.title"
          :owner="issue.owner"
          :repository="issue.repository"
          :number="issue.number"
          :avg-similarity="issue.avgSimilarity"
          :labels="issue.labels"
          :updated_at="issue.updated_at"
          :state="issue.state"
        />
        <CollapsibleRoot v-if="cluster.issues.length > 5">
          <CollapsibleTrigger
            class="rounded-md text-sm border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors w-full"
          >
            show {{ cluster.issues.length - 5 }} more
          </CollapsibleTrigger>
          <CollapsibleContent class="flex flex-col gap-4 mt-4">
            <GitHubIssue
              v-for="(issue, i) of cluster.issues.slice(5)"
              :key="i"
              :url="issue.url"
              :title="issue.title"
              :owner="issue.owner"
              :repository="issue.repository"
              :number="issue.number"
              :avg-similarity="issue.avgSimilarity"
              :labels="issue.labels"
              :updated_at="issue.updated_at"
              :state="issue.state"
            />
          </CollapsibleContent>
        </CollapsibleRoot>
      </section>
    </template>
  </div>
</template>

<style scoped>
section:first-of-type {
  view-transition-name: var(--section-index);
}
</style>
