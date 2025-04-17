<script setup lang="ts">
interface SimilarIssuesSummaryProps {
    issueTitle: string;
}
const { issueTitle } = defineProps<SimilarIssuesSummaryProps>()

const SIMILAR_SUMMARY = 'Similar issues - '
</script>

<template >
    <section class=" h-20 relative z-10 flex p-2 items-baseline gap-2 border-3 border-solid border-gray-600 rounded-md bg-transparent">
        <NuxtLink
          class="bg-transparent color-gray-500 hover:color-gray-300 active:color-white focus:color-gray-300 hover:cursor-pointer no-underline hover:underline transition-colors"
          @click="$router.back()"
          aria-label="BackArrow"
        >
            <SvgBackArrow class="w-8 h-8" />
        </NuxtLink>

        <div class="flex gap-1 whitespace-pre">
            <span class=" p-1 text-blue-500 ">
                <SvgSimilarIssues class=" w-6 h-6" />
            </span>
            <p class="text-2xl text-gray-300 font-bold">{{ SIMILAR_SUMMARY }}</p>
            <p class="text-2xl text-gray-500 font-bold">{{ issueTitle }}</p>
        </div>
    </section>
</template>
