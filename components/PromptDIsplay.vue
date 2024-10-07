<template>
    <div class="prompt-display">
      <h2>Generated Prompt:</h2>
      <p>{{ generatedPrompt }}</p>
    </div>
  </template>
  
  <script setup lang="ts">
  import { useTagStore } from '~/store/tagStore'
  import { computed } from 'vue'
  
  const tagStore = useTagStore()
  
  const generatedPrompt = computed(() => {
    const selectedTags = tagStore.selectedTags
    // This is a simple implementation. You'll want to enhance this with your LLM integration.
    return selectedTags.map(tag => tag.text).join(', ')
  })
  </script>
  
  <style scoped>
  .prompt-display {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  </style>