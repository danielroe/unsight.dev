<script setup lang="ts">
interface GithubIssueProps {
    url: string;
    title: string;
    owner: string;
    repository: string;
    number: number;
    avgSimilarity: number;
    labels: Array<string | { name: string, color?: string }>;
    updated_at: string;
}
const { url, title, owner, repository, number, avgSimilarity, labels, updated_at } = defineProps<GithubIssueProps>()

const UPDATED = 'Updated'
const PERCENT_SIMILAR = '% similar'
</script>

<template>
  <article class="h-25 flex flex-col issue-fade w-full gap-2 ">
    <div class="flex gap-1">
      <span class="h-5 flex-shrink-0 pt-6 i-tabler-circle-dot text-green-500" />
      
      <div class="flex flex-col flex-wrap justify-between">        
        <NuxtLink
          class="line-clamp-1 flex-grow text-md text-base flex-grow-0 no-underline color-current hover:underline"
          :href="url"
          target="_blank"
        >
          {{ title?.trim() }}
        </NuxtLink>
      </div>
    </div>

    <div
      class="flex items-baseline gap-3"
    >
      <div
        class="flex flex-col text-sm gap-2 text-gray-300 text-center"
      >
        <NuxtLink
          v-if="owner && repository"
          class="w-full line-clamp-1 no-underline hover:underline p-.5 rounded-md border-solid border border-gray-700 bg-gray-700 hover:bg-gray-500 hover:text-gray-200 active:color-white focus:text-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
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

        <NuxtLink
          class="w-full line-clamp-1 no-underline hover:underline p-.5 rounded-md border-solid border border-gray-700 bg-gray-700 hover:bg-gray-500 hover:text-gray-200 active:color-white focus:text-gray-200 hover:border-gray-400 active:border-white focus:border-gray-400 transition-colors"
          :to="owner && repository ? {
            name: 'owner-repo-issue',
            params: {
              owner: owner,
              repo: repository,
              issue: number,
            },
          } : ''"
        >
          {{ Math.floor(avgSimilarity * 100) }}{{ PERCENT_SIMILAR }}
        </NuxtLink>
      </div>

      <div
        class="flex flex-col gap-3"
      >
        <div  class="text-sm text-gray-500 ">
          {{ UPDATED }}

          <NuxtTime
            :datetime="updated_at"
            relative
          />
        </div>

        <div class="flex flex-row gap-1 flex-nowrap ">
          <span
            v-for="(label, j) of labels"
            :key="j"
            class="label rounded-full px-2 py-.5 whitespace-pre border-solid border-1 text-xs leading-tight"
            :style="labelColors(typeof label === 'string' ? '000000' : label.color || '000000')"
          >
            {{ typeof label === 'string' ? label : label.name }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.issue-fade {
  mask-image: linear-gradient(to right, black 40%, transparent);
  -webkit-mask-image: linear-gradient(to right, black 40%, transparent);
}

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
