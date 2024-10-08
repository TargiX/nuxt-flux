<template>
  <div class="tag-cloud" v-if="!loading">
    <div v-for="zone in tagStore.zones" :key="zone" class="zone-container">
      <h2>{{ zone }}</h2>
      <ForceGraph 
        :width="400" 
        :height="300" 
        :zone="zone" 
        @tagSelected="handleTagSelection"
        @secondaryTagSelected="handleSecondaryTagSelection"
      />
    </div>
    <div class="prompt-container">
      <h2>Generated Prompt:</h2>
      <p>{{ generatedPrompt }}</p>
    </div>
  </div>
  <div v-else class="loading">
    Loading...
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTagStore } from '~/store/tagStore'
import ForceGraph from './ForceGraph.vue'

const tagStore = useTagStore()
const { fetchTags } = tagStore

const loading = ref(true)

onMounted(async () => {
  await fetchTags()
  loading.value = false
})

const handleTagSelection = (tagId: string) => {
  tagStore.toggleTag(tagId)
}

const handleSecondaryTagSelection = (tagId: string) => {
  const primaryTag = tagStore.tags.find(tag => tag.secondaryTags?.some(secTag => secTag.id === tagId))
  if (primaryTag) {
    tagStore.toggleSecondaryTag(primaryTag.id, tagId)
  }
}

const generatedPrompt = computed(() => {
  const selectedPrimaryTags = tagStore.selectedTags.map(tag => tag.text)
  const selectedSecondaryTags = tagStore.selectedSecondaryTags.map(tag => tag.text)
  return [...selectedPrimaryTags, ...selectedSecondaryTags].join(', ')
})
</script>

<style lang="scss" scoped>
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding: 20px;
}

.zone-container {
  width: calc(33% - 20px);
  margin-bottom: 20px;
  
  h2 {
    text-align: center;
    margin-bottom: 10px;
  }
}

.prompt-container {
  width: 100%;
  margin-top: 20px;
  text-align: center;

  h2 {
    margin-bottom: 10px;
  }

  p {
    font-size: 1.2em;
    font-weight: bold;
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
}
</style>