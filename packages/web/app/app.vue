<script setup lang="ts">
useHead({
  bodyAttrs: {
    class: 'bg-shark-500 text-white',
  },
})

const version = useRuntimeConfig().public.version

useSeoMeta({
  titleTemplate: title => title ? `${title} - unsight.dev` : 'unsight.dev',
})

useServerSeoMeta({
  description: 'Detect duplicate GitHub issues, areas of concern and more across related repositories',
})

const { data: repos } = useFetchRepos()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <NuxtRouteAnnouncer />
    <main class="flex flex-col font-sans m-4 flex-grow">
      <nav>
        <NuxtLink
          to="/"
          class="flex flex-row items-center gap-2 text-lg font-bold my-4 no-underline color-current"
        >
          <span class="icon bg-pink-400 w-10 h-10 self-center"></span>
          <div class="flex flex-row items-baseline gap-2">
            <h1>unsight.dev</h1>
            <span class="text-pink-400 text-xs">
              v{{ version }}
            </span>
          </div>
        </NuxtLink>
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
