<script setup lang="ts">
const route = useRoute('dashboards-id')
const dashboardId = computed(() => route.params.id)

const { loggedIn, user } = useUserSession()

const { data: dashboard, status: dashboardStatus } = useFetch(() => `/api/dashboards/${dashboardId.value}`, {
  default: () => null as null | {
    id: string
    slug: string
    name: string
    githubId: number
    githubLogin: string | null
    createdAt: number
    repos: Array<{
      repoId: number
      fullName: string
      indexed: boolean
      issuesIndexed: number
    }>
  },
})

useSeoMeta({
  title: () => dashboard.value ? `${dashboard.value.name} - Dashboard` : 'Dashboard',
})

const isOwner = computed(() => {
  return loggedIn.value && dashboard.value && user.value?.githubId === dashboard.value.githubId
})

const totalIssues = computed(() => {
  return dashboard.value?.repos.reduce((sum, r) => sum + r.issuesIndexed, 0) || 0
})

const { data: clusters, refresh, status: clusterStatus } = useFetch(() => `/api/clusters/dashboard/${dashboardId.value}`, {
  baseURL: useRuntimeConfig().public.remote,
  default: () => [],
})

const showDuplicates = ref(false)
const { data: duplicates, status: duplicateStatus } = useFetch(() => `/api/duplicates/dashboard/${dashboardId.value}`, {
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
  unsub.forEach(u => u())
})

const openState = reactive<Record<string, boolean>>({})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex gap-2 items-center">
      <div class="flex-grow">
        <h2 class="text-base my-3 font-normal">
          <template v-if="dashboard">
            {{ dashboard.name }}
          </template>
          <template v-else-if="dashboardStatus === 'pending'">
            <span class="inline-block rounded-md h-5 bg-gray-500 w-40 animate-pulse" />
          </template>
        </h2>
        <a
          v-if="dashboard?.githubLogin"
          :href="`https://github.com/${dashboard.githubLogin}`"
          class="flex items-center gap-1.5 text-xs text-gray-500 no-underline hover:text-gray-300 transition-colors -mt-2 mb-2 w-fit"
        >
          <img
            :src="`https://github.com/${dashboard.githubLogin}.png?size=32`"
            :alt="dashboard.githubLogin"
            class="w-4 h-4 rounded-full"
          >
          <span>{{ dashboard.githubLogin }}</span>
        </a>
      </div>
      <NuxtLink
        v-if="isOwner"
        :to="`/dashboards/${dashboardId}/edit`"
        class="rounded-md text-sm border-solid border border-gray-700 bg-transparent color-gray-400 px-3 py-1 no-underline hover:color-gray-200 hover:border-gray-400 transition-colors"
      >
        edit
      </NuxtLink>
      <button
        class="rounded-full w-7 h-7 flex items-center justify-center border-solid border border-gray-700 bg-transparent color-gray-400 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex-shrink-0"
        :class="{ 'animate-spin opacity-50 pointer-events-none': clusterStatus === 'pending' || clusterStatus === 'idle' }"
        type="button"
        @click="refresh()"
      >
        <span class="text-gray-400 flex-shrink-0 i-tabler-refresh inline-block w-4 h-4" />
        <span class="sr-only">refresh data</span>
      </button>
    </div>

    <!-- Repo sidebar -->
    <div
      v-if="dashboard?.repos.length"
      class="flex flex-row flex-wrap gap-x-4 gap-y-2 text-sm mb-6 md:rounded-md md:border-solid md:border border-gray-700 md:px-4 py-3"
    >
      <div class="w-full text-xs text-gray-500 mb-1">
        {{ dashboard.repos.length }} repositories &middot; {{ totalIssues.toLocaleString() }} issues indexed
      </div>
      <NuxtLink
        v-for="repo in dashboard.repos"
        :key="repo.repoId"
        :to="`/${repo.fullName}`"
        class="no-underline text-gray-400 hover:underline hover:text-gray-200 active:text-white flex flex-row gap-1.5 items-center transition-colors"
      >
        <span
          class="h-1.5 w-1.5 inline-block rounded-full shadow-sm bg-opacity-90 mt-0.5 flex-shrink-0"
          :class="repo.indexed ? 'bg-green-600' : 'bg-gray-400'"
        />
        <span>{{ repo.fullName }}</span>
        <span class="text-xs text-gray-600">({{ repo.issuesIndexed.toLocaleString() }})</span>
      </NuxtLink>
    </div>

    <!-- Duplicates toggle -->
    <div
      v-if="duplicateStatus !== 'success' && duplicateStatus !== 'error'"
      class="mt-6 rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex items-center gap-2 justify-center pointer-events-none animate-pulse"
    >
      <span class="text-gray-400 flex-shrink-0 i-tabler-refresh inline-block w-4 h-4 animate-spin" />
      loading cross-repo duplicates
    </div>
    <button
      v-else-if="!showDuplicates && duplicates.length"
      class="mt-6 rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors flex items-center gap-2 justify-center w-full"
      type="button"
      @click="showDuplicates = true"
    >
      show {{ duplicates?.length }} possible cross-repo duplicates
    </button>

    <!-- Duplicates -->
    <template v-if="showDuplicates">
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
    </template>

    <!-- Cluster loading state -->
    <template v-if="clusterStatus === 'idle' || clusterStatus === 'pending'">
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

    <!-- Empty state -->
    <template v-else-if="!clusters.length">
      <section class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid">
        <h2 class="flex items-center my-4 font-bold text-2xl">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
        </h2>
        <p class="flex flex-row gap-2 leading-tightest">
          <span class="flex-shrink-0 text-gray-400 i-tabler-alert-triangle inline-block w-5 h-5" />
          no cross-repo clusters could be identified
        </p>
      </section>
    </template>

    <!-- Clusters -->
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
          v-for="(issue, i) of openState[c] !== true ? cluster.issues.slice(0, 5) : cluster.issues"
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
        <button
          v-if="cluster.issues.length > 5 && openState[c] !== true"
          class="rounded-md text-sm border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
          type="button"
          @click="openState[c] = !openState[c]"
        >
          show {{ cluster.issues.length - 5 }} more
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
