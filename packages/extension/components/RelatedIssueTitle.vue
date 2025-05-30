<template>
  <span>
    <template v-for="(part, index) in formattedParts" :key="index">
        <template v-if="part.isCode">
          <code>{{ part.content }}</code>
        </template>
        <template v-else>
          {{ part.content }}
        </template>
      </template>
  </span>
</template>

<script setup lang="ts">

const props = defineProps<{
  text: string
}>()


const formattedParts = computed(() => {
  const text = props.text;
  const parts = [];
  const regex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({isCode: false, content: text.slice(lastIndex, match.index)});
    }
    parts.push({isCode: true, content: match[1]});
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({isCode: false, content: text.slice(lastIndex)});
  }

  return parts;
})
</script>

<style scoped>
code {
  line-height: 1;
  padding: .2rem .4rem;
  background-color: var(--bgColor-neutral-muted);
  border-radius: 4px;
  font-size: 85%
}
</style>