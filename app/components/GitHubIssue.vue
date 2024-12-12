<script setup lang="ts">
import hexRgb from 'hex-rgb'
import rgbToHSL from 'rgb-to-hsl'

defineProps({
  url: String,
  title: String,
  owner: String,
  repository: String,
  number: {
    type: Number,
    required: true,
  },
  avgSimilarity: {
    type: Number,
    required: true,
  },
  labels: Array as () => Array<string | { name: string, color: string }>,
  // eslint-disable-next-line vue/prop-name-casing
  updated_at: {
    type: String,
    required: true,
  },
})

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
</script>

<template>
  <article class="flex flex-row gap-2 leading-tightest">
    <span class="flex-shrink-0 inline-block w-5 h-5 i-tabler-circle-dot text-green-500" />
    <div class="flex flex-row gap-2 flex-wrap md:flex-nowrap md:pb-6 flex-grow">
      <NuxtLink
        class="line-clamp-1 flex-grow text-sm md:text-base lg:flex-grow-0 no-underline color-current hover:underline"
        :href="url"
        target="_blank"
      >
        {{ title }}
      </NuxtLink>
      <div
        class="text-xs relative md:absolute md:mt-6 text-gray-400 mb-1"
      >
        <NuxtLink
          v-if="owner && repository"
          class="no-underline hover:underline color-current"
          :to="{
            name: 'owner-repo',
            params: {
              owner: owner,
              repo: repository,
            },
          }"
        >
          {{ owner }}/{{ repository }}
        </NuxtLink>
        &middot;
        updated
        <NuxtTime
          :datetime="updated_at"
          relative
        />
        &middot;
        {{ Math.floor(avgSimilarity * 100) }}% similar
      </div>
      <div class="flex flex-row gap-1 items-baseline flex-wrap md:flex-nowrap">
        <span
          v-for="(label, j) of labels"
          :key="j"
          class="label rounded-full px-2 py-0.5 whitespace-pre border-solid border-1 text-xs inline-block leading-tight"
          :style="labelColors(typeof label === 'string' ? '000000' : label.color || '000000')"
        >
          {{ typeof label === 'string' ? label : label.name }}
        </span>
      </div>
    </div>
  </article>
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
</style>
