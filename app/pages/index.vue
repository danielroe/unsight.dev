<script setup lang="ts">
const { data: allowedRepos, refresh } = useFetch('/api/repos', {
  baseURL: useRuntimeConfig().public.remote,
  default: () => [],
})

const route = useRoute()
const isCallback = ref(!!route.query.installation_id)
const numRepos = allowedRepos.value?.length

if (import.meta.client && isCallback.value) {
  const interval = setInterval(() => {
    refresh()
  }, 1000)
  const unsub = watch(allowedRepos, (newRepos) => {
    if (newRepos.length === numRepos) return

    isCallback.value = false
    clearInterval(interval)
    unsub()
  })
}

const repos = computed(() => allowedRepos.value.filter(r => r.issuesIndexed > 10))
</script>

<template>
  <section class="flex flex-col items-center flex-grow gap-4 md:gap-8">
    <p class="text-xl md:text-2xl lg:text-3xl mb-8 text-center mt-18 md:mt-36">
      cluster issues by similarity across multiple repositories
    </p>
    <NuxtLink
      class="bg-green-700 rounded-md px-5 py-3 font-medium flex flex-row gap-2 items-center color-white no-underline focus:bg-green-800 hover:bg-green-800 transition-colors shadow-lg"
      :href="isCallback ? '' : 'https://github.com/apps/unsight-dev/installations/new'"
      :class="{ 'pointer-events-none opacity-50': isCallback }"
    >
      <template v-if="isCallback">
        <span class="i-tabler-refresh animate-spin inline-block w-5 h-5" />
        updating repositories
      </template>
      <template v-else>
        <span class="i-ri:github-fill inline-block w-5 h-5" />
        install as a github app
      </template>
    </NuxtLink>
    <hr>
    <section
      v-if="allowedRepos.length"
      class="text-center"
    >
      or pick a repository to browse issue clusters
      <ul class="p-0 flex flex-row flex-wrap gap-4 justify-center px-10">
        <li
          v-for="repo in repos"
          :key="repo.repo"
          class="list-none"
        >
          <NuxtLink
            :to="`/${repo.repo}`"
            class="no-underline text-gray-400 hover:underline active:text-white flex flex-row gap-1 items-center"
          >
            <span
              class="h-1.5 w-1.5 inline-block rounded-full shadow-sm bg-opacity-90 mt-0.5"
              :class="repo.indexed ? 'bg-green-600' : 'bg-gray-200'"
            />
            {{ repo.repo }}
          </NuxtLink>
        </li>
      </ul>
    </section>
  </section>
</template>
