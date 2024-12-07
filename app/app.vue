<script setup lang="ts">
import hexRgb from 'hex-rgb'

const { data: clusters, refresh, status } = useFetch('/api/clusters/nuxt/nuxt')

function labelColors(color: string) {
  const value = hexRgb(color)

  return {
    '--label-r': value.red,
    '--label-g': value.green,
    '--label-b': value.blue,
  }
}

const stateColors: Record<string, string> = {
  open: 'text-green-500',
  closed: 'text-purple-500',
  merged: 'text-purple-500',
}

const openState = reactive<Record<string, boolean>>({})

async function updateSearch() {}
</script>

<template>
  <main class="font-sans m-2">
    <nav class="flex flex-row items-center gap-2 ">
      <h1 class="text-lg">
        unsight.dev
      </h1>
      <p class="flex gap-1 items-center bg-yellow-400 rounded-full color-black px-2 py-[2px] text-xs font-bold">
        proof of concept
      </p>
    </nav>
    <p class="flex gap-2 items-center">
      nuxt/nuxt
      <button
        class="rounded-full w-7 h-7 flex place-items-center border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
        :class="{ 'animate-spin opacity-50 pointer-events-none': status === 'pending' }"
        @click="() => refresh()"
      >
        <Icon
          size="medium"
          class="text-gray-400"
          name="tabler-refresh"
          alt="refresh data"
        />
      </button>
    </p>
    <form
      v-if="false"
      class="border-solid border border-gray-600 rounded-md flex flex-row items-center relative"
      disabled
      @submit.prevent="updateSearch"
    >
      <!-- <label>
        <input
          id="show-closed"
          type="checkbox"
          class="mr-2"
        >
        include closed issues
      </label> -->
      <input
        type="text"
        class="bg-transparent pl-8 pr-2 py-2 color-white border-0 flex-grow"
        placeholder="repository"
      >
      <Icon
        size="large"
        class="absolute ml-2 text-gray-400"
        name="tabler-search"
      />
    </form>
    <section
      v-for="(cluster, c) of clusters"
      :key="c"
      class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid"
    >
      <h2>
        <span class="text-gray-500 inline-block mr-1 font-normal">#</span>{{ c + 1 }}
      </h2>
      <article
        v-for="(issue, i) of openState[c] !== true ? cluster.slice(0, 5) : cluster"
        :key="i"
      >
        <NuxtLink
          class="flex flex-row gap-2 leading-tightest no-underline color-current"
          :href="issue.html_url"
        >
          <Icon
            size="large"
            class="flex-shrink-0"
            :class="stateColors[issue.state] || 'text-gray-800'"
            :name="issue.pull_request ? 'tabler-git-pull-request' : issue.state === 'closed' ? 'tabler-circle-check' : 'tabler-circle-dot'"
          />
          <div class="flex flex-row gap-2 flex-wrap md:flex-nowrap md:pb-6 flex-grow">
            <span class="line-clamp-1 flex-grow text-sm md:text-base lg:flex-grow-0">
              {{ issue.title }}
            </span>
            <span
              class="text-xs relative md:absolute md:mt-6 text-gray-400 mb-1"
            >
              <span
                v-if="issue.repository"
              >
                {{ issue.repository?.owner.name }}/{{ issue.repository.name }}
              </span>
              &middot;
              updated
              <NuxtTime
                :datetime="issue.updated_at"
                relative
              />
            </span>
            <div class="flex flex-row gap-1 items-baseline flex-wrap md:flex-nowrap">
              <span
                v-for="(label, j) of issue.labels"
                :key="j"
                class="label bg-gray-200 text-gray-800 rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 text-xs inline-block leading-tight"
                :style="labelColors(typeof label === 'string' ? '000000' : label.color || '000000')"
              >
                {{ typeof label === 'string' ? label : label.name }}
              </span>
            </div>
          </div>
        </NuxtLink>
      </article>
      <button
        v-if="cluster.length > 5 && openState[c] !== true"
        class="rounded-md border-solid border border-gray-700 bg-transparent color-gray-400 py-2 hover:color-gray-200 active:color-white focus:color-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
        @click="openState[c] = !openState[c]"
      >
        show {{ cluster.length - 5 }} more
      </button>
    </section>
  </main>
  <footer class="font-sans mt-auto p-2 text-center text-sm opacity-75 hover:opacity-100">
    <!-- <a
        class="hover:underline text-white"
        href="https://github.com/danielroe/unsight.dev"
      >
        source
      </a>
      &middot; -->
    made with ❤️ by <a
      class="font-semibold hover:underline text-white"
      href="https://bsky.app/profile/danielroe.dev"
    >
      @danielroe.dev
    </a>
  </footer>
</template>

<style scoped>
.label {
  background: rgba(var(--label-r), var(--label-g), var(--label-b), 0.30);
  color: white;
  border-color: rgba(var(--label-r), var(--label-g), var(--label-b), 0.7);
}
</style>

<style>
:root {
  background-color: #202830;
  color: white;
}
</style>
