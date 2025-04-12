<!-- TODO: Implement different skeletons for each view -->

<template >
    <section
        v-for="i in 7"
        :key="i"
        :style="{ '--section-index': i }"
        class="flex flex-col gap-4 md:rounded-md md:border-solid border border-gray-700 md:px-4 pb-8 mt-6 columns-1 lg:columns-2 border-b-solid animate-pulse"
    >
        <h2 class="flex items-center my-4 font-bold text-2xl">
            <span class="text-gray-500 inline-block mr-1 font-normal">#</span>
            <span class="inline-block rounded-md h-5 bg-gray-500 w-5" />
        </h2>
        
        <GitHubIssueLoading
            v-for="s in Math.round(Math.random() * 3) + 1"
            :key="s"
        />
    </section>
</template>
