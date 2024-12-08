<script setup lang="ts">
useSeoMeta({
  title: 'unsight.dev',
  description: 'Detect duplicate GitHub issues, areas of concern and more across related repositories',
})
</script>

<template>
  <main class="font-sans m-2">
    <nav class="flex flex-row items-center gap-2 ">
      <h1 class="text-lg">
        <NuxtLink
          to="/"
          class="no-underline color-current"
        >
          unsight.dev
        </NuxtLink>
      </h1>
      <p class="flex gap-1 items-center bg-yellow-400 rounded-full color-black px-2 py-[2px] text-xs font-bold">
        proof of concept
      </p>
    </nav>
    <NuxtPage />
  </main>
  <footer class="justify-center flex gap-2 font-sans mt-auto p-2 text-center text-sm opacity-75 hover:opacity-100">
    <a
      class="no-underline hover:underline text-white"
      href="https://github.com/danielroe/unsight.dev"
    >
      source
    </a>
    &middot;
    made with ❤️ by <a
      class="no-underline font-semibold hover:underline text-white"
      href="https://bsky.app/profile/danielroe.dev"
    >
      @danielroe.dev
    </a>
  </footer>
</template>

<style>
:root {
  background-color: #202830;
  color: white;
}
</style>
