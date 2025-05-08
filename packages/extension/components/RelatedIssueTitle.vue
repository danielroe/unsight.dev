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

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

const formattedParts = computed(() => {
  const escapedText = escapeHtml(props.text);
  const parts = [];
  const regex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(escapedText)) !== null) {
    if (match.index > lastIndex) {
      parts.push({isCode: false, content: escapedText.slice(lastIndex, match.index)});
    }
    parts.push({isCode: true, content: match[1]});
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < escapedText.length) {
    parts.push({isCode: false, content: escapedText.slice(lastIndex)});
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