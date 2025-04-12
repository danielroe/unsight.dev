
<script setup lang="ts">
    const NO_CLUSTERS = 'no clusters could be identified'
</script>

<template >
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
          {{ NO_CLUSTERS }}
        </p>
      </section>
</template>
