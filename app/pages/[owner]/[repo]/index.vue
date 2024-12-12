<script setup lang="ts">
import hexRgb from 'hex-rgb'
import rgbToHSL from 'rgb-to-hsl'

const { data: allowedRepos } = useRepos()

const route = useRoute('owner-repo')
const selectedRepo = computed(() => route.params.owner && route.params.repo ? `${route.params.owner}/${route.params.repo}` : 'nuxt/nuxt')

const { data: clusters, refresh, status } = useFetch(() => `/api/clusters/${selectedRepo.value}`, {
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

function labelColors(color: string) {
  const value = hexRgb(color)
  const [hue, saturation, lightness] = rgbToHSL(value.red, value.green, value.blue)

  return {
    '--label-r': Math.round(value.red),
    '--label-g': Math.round(value.green),
    '--label-b': Math.round(value.blue),
    '--label-h': Math.round(hue),
    '--label-s': Math.round(Number.parseInt(saturation)),
    '--label-l': Math.round(Number.parseInt(lightness)),
  }
}

const openState = reactive<Record<string, boolean>>({})
</script>

<template>
  <div>
    <form @submit.prevent="() => refresh()">
      <p class="flex gap-2 items-center">
        {{ selectedRepo }}
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
      </p>
      <label class="w-full border-solid border border-gray-600 rounded-md flex flex-row items-center relative">
        <span class="sr-only">pick a repository to cluster issues</span>
        <select
          :value="selectedRepo"
          class="pl-8 bg-transparent pr-2 py-2 color-white border-0 w-full"
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
    <template v-if="status === 'idle' || status === 'pending'">
      <section
        v-for="i in 7"
        :key="i"
        :style="{ '--section-index': i }"
        class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid animate-pulse"
      >
        <h2 class="flex items-center">
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
          <span class="inline-block rounded-md h-5 bg-gray-500 w-5" />
        </h2>
        <article>
          <div
            class="flex flex-row gap-2 leading-tightest no-underline color-current"
          >
            <span
              class="flex-shrink-0 text-gray-500 i-tabler-circle-dot inline-block w-5 h-5"
            />
            <div class="rounded-full h-4 bg-gray-500 w-70" />
          </div>
        </article>
      </section>
    </template>
    <template v-else-if="!clusters.length">
      <section
        class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid"
      >
        <h2 class="flex items-center">
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
        <h2>
          <span class="text-gray-500 inline-block mr-1 font-normal">#</span>{{ c + 1 }}
        </h2>
        <article
          v-for="(issue, i) of openState[c] !== true ? cluster.slice(0, 5) : cluster"
          :key="i"
          class="flex flex-row gap-2 leading-tightest"
        >
          <span class="flex-shrink-0 inline-block w-5 h-5 i-tabler-circle-dot text-green-500" />
          <div class="flex flex-row gap-2 flex-wrap md:flex-nowrap md:pb-6 flex-grow">
            <NuxtLink
              class="line-clamp-1 flex-grow text-sm md:text-base lg:flex-grow-0 no-underline color-current hover:underline"
              :href="issue.url"
              target="_blank"
            >
              {{ issue.title }}
            </NuxtLink>
            <div
              class="text-xs relative md:absolute md:mt-6 text-gray-400 mb-1"
            >
              <NuxtLink
                v-if="issue.owner && issue.repository"
                class="no-underline hover:underline color-current"
                :to="{
                  name: 'owner-repo',
                  params: {
                    owner: issue.owner,
                    repo: issue.repository,
                  },
                }"
              >
                {{ issue.owner }}/{{ issue.repository }}
              </NuxtLink>
              &middot;
              updated
              <NuxtTime
                :datetime="issue.updated_at"
                relative
              />
              &middot;
              {{ Math.floor(issue.avgSimilarity * 100) }}% similar
            </div>
            <div class="flex flex-row gap-1 items-baseline flex-wrap md:flex-nowrap">
              <span
                v-for="(label, j) of issue.labels"
                :key="j"
                class="label rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 text-xs inline-block leading-tight"
                :style="labelColors(typeof label === 'string' ? '000000' : label.color || '000000')"
              >
                {{ typeof label === 'string' ? label : label.name }}
              </span>
            </div>
          </div>
        </article>
        <button
          v-if="cluster.length > 5 && openState[c] !== true"
          class="rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
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
.label {
  --lightness-threshold: 0.6;
  --perceived-lightness: calc(((var(--label-r) * 0.2126) + (var(--label-g) * 0.7152) + (var(--label-b) * 0.0722)) / 255);
  --lightness-switch: max(0, min(calc((var(--perceived-lightness) - var(--lightness-threshold)) * -1000), 1));
  --lighten-by: calc(((var(--lightness-threshold) - var(--perceived-lightness)) * 100) * var(--lightness-switch));
  background: rgba(var(--label-r), var(--label-g), var(--label-b), 0.18);
  color: hsl(var(--label-h),calc(var(--label-s) * 1%),calc((var(--label-l) + var(--lighten-by)) * 1%));
  border-color: rgba(var(--label-r), var(--label-g), var(--label-b), 0.7);
}
section:first-of-type {
  view-transition-name: var(--section-index);
}
</style>
