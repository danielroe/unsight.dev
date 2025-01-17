<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'bg-shark-500 text-white',
  },
})

const version = useRuntimeConfig().public.version
const title = ref('unsight.dev')

useSeoMeta({
  title,
  titleTemplate: (pageTitle) => {
    return pageTitle ? `${pageTitle} - Home Page` : 'Home Page'
  },
  description: 'Detect duplicate GitHub issues, areas of concern and more across related repositories',
})

const { data: repos } = useRepos()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NuxtRouteAnnouncer />
    <main class="flex flex-col font-sans m-4 flex-grow">
      <nav class="flex flex-row items-baseline gap-2 ">
        <span class="icon bg-pink-400 w-10 h-10 self-center"></span>
        <h1 class="text-lg font-bold my-4 flex gap-2 items-center">
          <NuxtLink
            to="/"
            class="no-underline color-current"
          >
            unsight.dev
          </NuxtLink>
        </h1>
        <p class="flex gap-1 items-center text-pink-400 text-xs font-bold">
          v{{ version }}
        </p>
      </nav>
      <NuxtPage />
    </main>
    <footer class="justify-center flex flex-col md:flex-row gap-2 font-sans p-2 text-center text-sm opacity-75 hover:opacity-100 mb-4">
      <a
        class="no-underline hover:underline text-white"
        href="https://github.com/danielroe/unsight.dev"
      >
        source
      </a>
      <span class="before:hidden md:before:inline-block before:content-['·'] before:mr-2">
        made with ❤️ by
        <a
          class="no-underline font-semibold hover:underline text-white"
          href="https://bsky.app/profile/danielroe.dev"
        >
          @danielroe.dev
        </a>
      </span>
      <span class="before:hidden md:before:inline-block before:content-['·'] before:mr-2">
        {{ repos.length }} repos
      </span>
    </footer>
  </div>
</template>

<style scoped>
.icon {
  mask: url('/icon.svg') no-repeat center;
}
</style>
