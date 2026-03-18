<script setup lang="ts">
const route = useRoute('dashboards-id-edit')
const dashboardId = computed(() => route.params.id)

const { loggedIn, user } = useUserSession()

const { data: dashboard, status: dashboardStatus } = useFetch(() => `/api/dashboards/${dashboardId.value}`, {
  default: () => null as null | {
    id: string
    slug: string
    name: string
    githubId: number
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
  title: () => dashboard.value ? `Edit ${dashboard.value.name}` : 'Edit Dashboard',
})

const isOwner = computed(() => {
  return loggedIn.value && dashboard.value && user.value?.githubId === dashboard.value.githubId
})

// Form state — initialised from fetched dashboard data
const editName = ref('')
const selectedRepos = ref<string[]>([])

watch(dashboard, (d) => {
  if (d) {
    editName.value = d.name
    selectedRepos.value = d.repos.map(r => r.fullName)
  }
}, { immediate: true })

const { data: allRepos } = useRepos()
const availableRepos = computed(() => allRepos.value.filter(r => r.issuesIndexed > 0))

const saving = ref(false)
const deleting = ref(false)

async function saveDashboard() {
  if (!editName.value.trim() || !selectedRepos.value.length)
    return
  saving.value = true
  try {
    await $fetch(`/api/dashboards/${dashboardId.value}`, {
      method: 'PUT',
      body: {
        name: editName.value.trim(),
        repos: selectedRepos.value,
      },
    })
    await navigateTo(`/dashboards/${dashboardId.value}`)
  }
  catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    console.error('Failed to save dashboard:', error.data?.message || e)
  }
  finally {
    saving.value = false
  }
}

const showDeleteDialog = ref(false)

async function deleteDashboard() {
  deleting.value = true
  try {
    await $fetch(`/api/dashboards/${dashboardId.value}`, {
      method: 'DELETE',
    })
    await navigateTo('/dashboards')
  }
  catch (e: unknown) {
    const error = e as { data?: { message?: string } }
    console.error('Failed to delete dashboard:', error.data?.message || e)
  }
  finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center gap-3 my-4">
      <NuxtLink
        :to="`/dashboards/${dashboardId}`"
        class="text-gray-400 no-underline hover:text-gray-200 transition-colors"
      >
        <span class="i-tabler-arrow-left inline-block w-5 h-5" />
      </NuxtLink>
      <h2 class="text-base font-normal">
        edit dashboard
      </h2>
    </div>

    <template v-if="dashboardStatus === 'pending'">
      <div class="flex items-center gap-2 text-gray-400 animate-pulse">
        <span class="i-tabler-refresh inline-block w-4 h-4 animate-spin" />
        loading
      </div>
    </template>

    <template v-else-if="!dashboard">
      <p class="text-gray-400">
        dashboard not found
      </p>
    </template>

    <template v-else-if="!isOwner">
      <p class="text-gray-400">
        you don't have permission to edit this dashboard
      </p>
    </template>

    <template v-else>
      <form
        class="flex flex-col gap-4 md:rounded-md md:border-solid md:border border-gray-700 md:px-4 py-4"
        @submit.prevent="saveDashboard"
      >
        <Label class="flex flex-col gap-1">
          <span class="text-sm text-gray-400">name</span>
          <input
            v-model="editName"
            type="text"
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

        <div class="flex gap-2 items-center">
          <button
            type="submit"
            :disabled="!editName.trim() || !selectedRepos.length || saving"
            class="bg-green-700 rounded-md px-4 py-2 font-medium color-white text-sm hover:bg-green-800 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {{ saving ? 'saving...' : 'save changes' }}
          </button>
          <NuxtLink
            :to="`/dashboards/${dashboardId}`"
            class="rounded-md px-4 py-2 text-sm color-gray-400 no-underline hover:color-gray-200 transition-colors"
          >
            cancel
          </NuxtLink>
          <AlertDialogRoot v-model:open="showDeleteDialog">
            <AlertDialogTrigger
              type="button"
              :disabled="deleting"
              class="ml-auto rounded-md px-4 py-2 text-sm bg-transparent color-red-400 border-solid border border-red-900 hover:bg-red-900/20 hover:color-red-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {{ deleting ? 'deleting...' : 'delete dashboard' }}
            </AlertDialogTrigger>
            <AlertDialogPortal>
              <AlertDialogOverlay class="fixed inset-0 bg-black/60 z-50" />
              <AlertDialogContent class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-shark-400 rounded-lg p-6 z-50 max-w-md w-[90vw] border-solid border border-gray-700">
                <AlertDialogTitle class="text-base font-medium mb-2">
                  delete dashboard
                </AlertDialogTitle>
                <AlertDialogDescription class="text-sm text-gray-400 mb-5">
                  this action cannot be undone. this will permanently delete the dashboard and remove its configuration.
                </AlertDialogDescription>
                <div class="flex gap-3 justify-end">
                  <AlertDialogCancel class="rounded-md px-4 py-2 text-sm bg-transparent color-gray-400 border-solid border border-gray-700 hover:color-gray-200 hover:border-gray-400 transition-colors cursor-pointer">
                    cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    class="rounded-md px-4 py-2 text-sm bg-red-900/30 color-red-300 border-solid border border-red-900 hover:bg-red-900/50 transition-colors cursor-pointer"
                    @click="deleteDashboard"
                  >
                    delete
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialogPortal>
          </AlertDialogRoot>
        </div>
      </form>
    </template>
  </div>
</template>
