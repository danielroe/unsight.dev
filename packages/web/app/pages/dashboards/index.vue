<script setup lang="ts">
useSeoMeta({
  title: 'Dashboards',
})

const { loggedIn } = useUserSession()

const { data: dashboards, refresh, status } = useFetch('/api/dashboards', {
  default: () => [],
  immediate: loggedIn.value,
})

// Watch for login state changes
watch(loggedIn, (val) => {
  if (val)
    refresh()
})

const { data: allRepos } = useRepos()
const availableRepos = computed(() => allRepos.value.filter(r => r.issuesIndexed > 0))

// Create dashboard form
const showCreateForm = ref(false)
const newDashboardName = ref('')
const selectedRepos = ref<string[]>([])
const creating = ref(false)

async function createDashboard() {
  if (!newDashboardName.value.trim() || !selectedRepos.value.length)
    return
  creating.value = true
  try {
    const result = await $fetch('/api/dashboards', {
      method: 'POST',
      body: {
        name: newDashboardName.value.trim(),
        repos: selectedRepos.value,
      },
    })
    await navigateTo(`/dashboards/${result.id}`)
  }
  catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    console.error('Failed to create dashboard:', error.data?.message || e)
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 my-4">
      <h2 class="text-base font-normal">
        dashboards
      </h2>
      <button
        v-if="loggedIn && !showCreateForm"
        class="rounded-md text-sm border-solid border border-gray-700 bg-transparent color-gray-400 px-3 py-1 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
        type="button"
        @click="showCreateForm = true"
      >
        + new dashboard
      </button>
    </div>

    <template v-if="!loggedIn">
      <p class="text-gray-400 text-sm mb-4">
        sign in with GitHub to create and manage dashboards of related repositories
      </p>
      <a
        href="/auth/github"
        class="bg-green-700 rounded-md px-4 py-2 font-medium flex flex-row gap-2 items-center color-white no-underline focus:bg-green-800 hover:bg-green-800 transition-colors shadow-lg w-fit text-sm"
      >
        <span class="i-ri:github-fill inline-block w-4 h-4" />
        sign in with GitHub
      </a>
    </template>

    <!-- Create form -->
    <template v-if="showCreateForm">
      <form
        class="flex flex-col gap-3 md:rounded-md md:border-solid md:border border-gray-700 md:px-4 py-4 mb-6"
        @submit.prevent="createDashboard"
      >
        <Label class="flex flex-col gap-1">
          <span class="text-sm text-gray-400">name</span>
          <input
            v-model="newDashboardName"
            type="text"
            placeholder="e.g. Nuxt Ecosystem"
            class="bg-shark-500 rounded-md px-3 py-2 color-white border-solid border border-gray-600 text-sm"
          >
        </Label>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-gray-400">repositories</span>
          <ToggleGroupRoot
            v-model="selectedRepos"
            type="multiple"
            class="flex flex-row flex-wrap gap-2"
          >
            <ToggleGroupItem
              v-for="repo in availableRepos"
              :key="repo.repo"
              :value="repo.repo"
              class="text-xs rounded-md px-2 py-1 border-solid border transition-colors border-gray-700 bg-transparent color-gray-400 hover:color-gray-200 hover:border-gray-400 data-[state=on]:border-green-600 data-[state=on]:bg-green-700/20 data-[state=on]:color-green-300"
            >
              {{ repo.repo }}
            </ToggleGroupItem>
          </ToggleGroupRoot>
          <p
            v-if="selectedRepos.length"
            class="text-xs text-gray-500 mt-1"
          >
            {{ selectedRepos.length }} selected
          </p>
        </div>
        <div class="flex gap-2">
          <button
            type="submit"
            :disabled="!newDashboardName.trim() || !selectedRepos.length || creating"
            class="bg-green-600 rounded-md px-4 py-2 font-medium color-white text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {{ creating ? 'creating...' : 'create dashboard' }}
          </button>
          <button
            type="button"
            class="rounded-md px-4 py-2 text-sm bg-transparent border-0 color-gray-400 hover:color-gray-200 transition-colors cursor-pointer"
            @click="showCreateForm = false"
          >
            cancel
          </button>
        </div>
      </form>
    </template>

    <!-- Dashboard list -->
    <template v-if="loggedIn && status === 'pending'">
      <div class="flex items-center gap-2 text-gray-400 animate-pulse">
        <span class="i-tabler-refresh inline-block w-4 h-4 animate-spin" />
        loading dashboards
      </div>
    </template>
    <template v-else-if="loggedIn && dashboards.length">
      <ul class="p-0 flex flex-col gap-3">
        <li
          v-for="dashboard in dashboards"
          :key="dashboard.id"
          class="list-none"
        >
          <NuxtLink
            :to="`/dashboards/${dashboard.id}`"
            class="no-underline flex flex-row items-center gap-3 md:rounded-md md:border-solid md:border border-gray-700 md:px-4 py-3 hover:border-gray-400 transition-colors group"
          >
            <span class="i-tabler-layout-dashboard inline-block w-5 h-5 text-gray-400 group-hover:text-gray-200" />
            <span class="color-white group-hover:underline">{{ dashboard.name }}</span>
          </NuxtLink>
        </li>
      </ul>
    </template>
    <template v-else-if="loggedIn && !showCreateForm">
      <p class="text-gray-500 text-sm">
        no dashboards yet. create one to cluster issues across multiple repositories.
      </p>
    </template>
  </div>
</template>
