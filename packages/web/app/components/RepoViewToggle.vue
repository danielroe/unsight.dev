<script setup lang="ts">

const { selectedView, toggleViewState, } = useSelectedView()

</script>

<template>
    <section class="flex gap-2 items-center p-2 border-solid border border-gray-700 rounded-sm bg-slate-700">
        <button
            class="rounded-sm p-0.5 text-md border-solid border bg-slate-950 color-gray-400 transition-colors"
            :class="[
                selectedView === 'PaperStack'
                ? 'border-cyan-400  color-cyan-400 bg-cyan-700 '
                : 'border-cyan-200 hover:color-cyan-200 hover:bg-cyan-500'
            ]"
            type="button"
            value="PaperStack"
            @click="toggleViewState($event)"
            aria-label="PaperStack"
        >
            <SvgPaperStack />
        </button>

        <button
            class="rounded-sm p-0.5 text-md border-solid border bg-slate-950 color-gray-400 transition-colors"
            :class="[
                selectedView === 'WindowPane'
                ? 'border-red-400 color-red-400 bg-red-700'
                : 'border-red-200 hover:color-red-200 hover:bg-red-500'
            ]"
            type="button"
            value="WindowPane"
            @click="toggleViewState($event)"
            aria-label="WindowPane"
        >
            <SvgWindowPane />
        </button>

        <button
            class="rounded-sm p-0.5 text-md border-solid border border-gray-700 bg-slate-950 color-gray-400 transition-colors"
            :class="[
                selectedView === 'BookShelf'
                ? 'border-green-400 color-green-400 bg-green-700'
                : 'border-green-200 hover:color-green-200 hover:bg-green-500'
            ]"
            type="button"
            value="BookShelf"
            @click="toggleViewState($event)"
            aria-label="BookShelf"
        >
            <SvgBookShelf />
        </button>
  </section>
</template>
