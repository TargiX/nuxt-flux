// stores/tagStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRuntimeConfig } from '#app';
import type { Tag } from '~/types/tag';
import { initializeTags, getAvailableZones } from '~/services/tagProcessingService';
import { toggleTag } from '~/services/tagSelectionService';
import { computeGraphData } from '~/services/graphLayoutService';

export const useTagStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([]);
  const zones = ref<string[]>(getAvailableZones());
  const focusedZone = ref<string>(zones.value[0] || 'Subject');

  // Initialize tags on store creation
  tags.value = initializeTags();

  function setFocusedZone(zone: string) {
    console.log(`Setting focused zone to ${zone}`);
    focusedZone.value = zone;
  }

  async function handleTagToggle(id: string) {
    const config = useRuntimeConfig();
    const apiKey = config.public.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    const { updatedTags, selectedTag } = await toggleTag(id, tags.value, apiKey);
    tags.value = updatedTags;
    console.log(`Toggled tag ${id} to selected: ${selectedTag.selected}`);
  }

  function updateTagText(id: string, newText: string) {
    const tag = tags.value.find(t => t.id === id);
    if (tag && tag.text !== newText) {
      tag.text = newText;
      console.log(`Updated text for tag ${id} to: ${newText}`);
      // Note: Graph nodes/links computed properties will update automatically due to reactivity.
    }
  }

  // Computed properties for graph visualization
  const graphNodes = computed(() => computeGraphData(tags.value, focusedZone.value).nodes);
  const graphLinks = computed(() => computeGraphData(tags.value, focusedZone.value).links);

  return {
    tags,
    zones,
    focusedZone,
    setFocusedZone,
    toggleTag: handleTagToggle,
    updateTagText,
    graphNodes,
    graphLinks
  };
});
