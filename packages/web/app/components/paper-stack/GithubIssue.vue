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

const UPDATED = 'updated'
const PERCENT_SIMILAR = '% similar'

const { url, title, owner, repository, number, avgSimilarity, labels, updated_at } = defineProps<GithubIssueProps>()
</script>

<template>
  <article class="overflow-hidden flex flex-row gap-1 ">
    <span class="flex-shrink-0 inline-block h-5 i-tabler-circle-dot text-green-500 mt-.5" />

    <div class="issue-fade w-full">
      <div class="flex flex-col flex-nowrap gap-1">
        <NuxtLink
          class="line-clamp-1 flex-grow text-sm md:text-base lg:flex-grow-0 no-underline color-current hover:underline"
          :href="url"
          target="_blank"
        >
          {{ title?.trim() }}
        </NuxtLink>

        <div
          class="text-xs relative text-gray-400 mb-1 break-words"
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
          {{ UPDATED }}

          <NuxtTime
            :datetime="updated_at"
            relative
          />

          &middot;

          <NuxtLink
            class="no-underline hover:underline color-current"
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
