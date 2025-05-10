// stores/tagStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRuntimeConfig } from '#app';
import type { Tag } from '~/types/tag';
import { initializeTags, getAvailableZones } from '~/services/tagProcessingService';
import { toggleTag } from '~/services/tagSelectionService';
import { computeGraphData } from '~/services/graphLayoutService';

// Interface for the saved dream data structure (subset of what's saved)
interface DreamData {
  focusedZone: string;
  tags: Tag[];
  generatedPrompt?: string; // Optional
  imageUrl?: string | null; // Optional
}

// Interface for D3 zoom transform (simplified)
interface ViewportState {
  x: number;
  y: number;
  k: number; // Zoom scale
}

export const useTagStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([]);
  const zones = ref<string[]>(getAvailableZones());
  const focusedZone = ref<string>(zones.value[0] || 'Subject');
  const zoneViewportStates = ref<Map<string, ViewportState>>(new Map()); // New state for viewport per zone
  
  // --- Add state for prompt and image ---
  const currentGeneratedPrompt = ref<string>('');
  const currentImageUrl = ref<string | null>(null);
  const loadedDreamId = ref<number | null>(null); // Track loaded dream ID
  const hasUnsavedChanges = ref(false); // Track unsaved changes
  let _refreshDreamsList: (() => void) | null = null; // Placeholder for refresh function
  // ------------------------------------

  // Initialize tags on store creation
  tags.value = initializeTags();
  const initialTagsState = JSON.parse(JSON.stringify(tags.value)); // Store initial state for reset

  // Function to save viewport state for a zone
  function saveZoneViewport(zone: string, viewport: ViewportState) {
    zoneViewportStates.value.set(zone, viewport);
    console.log(`[TagStore] Viewport saved for zone ${zone}:`, viewport);
  }

  // Function to get viewport state for a zone
  function getZoneViewport(zone: string): ViewportState | undefined {
    return zoneViewportStates.value.get(zone);
  }

  function setFocusedZone(zone: string) {
    // Switching zones should not mark unsaved changes
    focusedZone.value = zone;
    // TODO: Trigger viewport load for the new `zone` *after* it has changed
    // and graph is ready for the new zone's data.
  }

  async function handleTagToggle(id: string) {
    const originalSelectedState = tags.value.find(t => t.id === id)?.selected;
    const { updatedTags, selectedTag } = await toggleTag(id, tags.value);
    if (selectedTag.selected !== originalSelectedState) {
        hasUnsavedChanges.value = true;
    }
    tags.value = updatedTags;
    currentImageUrl.value = null;
  }

  function updateTagText(id: string, newText: string) {
    const tag = tags.value.find(t => t.id === id);
    if (tag && tag.text !== newText) {
      tag.text = newText;
      hasUnsavedChanges.value = true; 
    }
  }

  // Computed properties for graph visualization
  const graphNodes = computed(() => computeGraphData(tags.value, focusedZone.value).nodes);
  const graphLinks = computed(() => computeGraphData(tags.value, focusedZone.value).links);

  // --- Action to load a saved dream state ---
  function loadDreamState(dreamData: DreamData, dreamId: number | null) {
    console.log("Loading dream state for ID:", dreamId);
    if (!dreamData || typeof dreamData !== 'object') {
      console.error("Invalid dream data provided to loadDreamState");
      return;
    }

    // Recreate the base predefined tags
    const baseTags = initializeTags();

    // Build a map of id to Tag object for fast lookup
    const tagMap = new Map<string, Tag>();
    baseTags.forEach(t => tagMap.set(t.id, t));

    // Start reconstructedTags with base tags
    const reconstructedTags: Tag[] = [...baseTags];

    // Overlay saved tag states
    dreamData.tags.forEach(savedTag => {
      const existing = tagMap.get(savedTag.id);
      if (existing) {
        // Predefined tag: apply saved properties
        existing.selected = savedTag.selected;
        if (savedTag.x !== undefined) existing.x = savedTag.x;
        if (savedTag.y !== undefined) existing.y = savedTag.y;
      } else {
        // Dynamic tag: re-create Tag object
        const dynamicTag: Tag = {
          id: savedTag.id,
          text: savedTag.text,
          size: savedTag.size,
          selected: savedTag.selected,
          zone: savedTag.zone,
          alias: savedTag.alias,
          parentId: savedTag.parentId,
          x: savedTag.x,
          y: savedTag.y,
          isLoading: savedTag.isLoading || false,
          children: [],
          depth: savedTag.depth
        };

        // Attach dynamic tag to its parent in base tags
        if (dynamicTag.parentId) {
          const parent = tagMap.get(dynamicTag.parentId);
          if (parent) {
            parent.children = parent.children ? [...parent.children, dynamicTag] : [dynamicTag];
          }
        }

        // Add to reconstructed tags and map
        reconstructedTags.push(dynamicTag);
        tagMap.set(dynamicTag.id, dynamicTag);
      }
    });

    // Commit reconstructed tags to store
    tags.value = reconstructedTags;

    // Restore focused zone, prompt, image
    focusedZone.value = dreamData.focusedZone || zones.value[0];
    currentGeneratedPrompt.value = dreamData.generatedPrompt || '';
    currentImageUrl.value = dreamData.imageUrl || null;
    loadedDreamId.value = dreamId;
    hasUnsavedChanges.value = false;
    console.log("Dream state loaded.");
  }
  // ------------------------------------------

  // --- Action to reset to initial/current state ---
  function resetToCurrentSession({isNewDream = false}: {isNewDream?: boolean} = {}) {
    console.log('Resetting to current session state');
    if (isNewDream) {
      // For a new dream, start with completely blank tag list
      tags.value = initializeTags();
    } else {
      // Restore predefined initial tags
      tags.value = JSON.parse(JSON.stringify(initialTagsState));
    }
    focusedZone.value = zones.value[0];
    currentGeneratedPrompt.value = '';
    currentImageUrl.value = null;
    loadedDreamId.value = null; // Indicate current session is active
    hasUnsavedChanges.value = false; // Reset flag assumes we revert changes
  }
  // ----------------------------------------------

  // --- Actions to set prompt and image --- (add unsaved changes flag)
  function setCurrentGeneratedPrompt(prompt: string, markDirty: boolean = true) {
    if (currentGeneratedPrompt.value !== prompt) {
        currentGeneratedPrompt.value = prompt;
        if (markDirty) {
          hasUnsavedChanges.value = true;
        }
    }
  }
  function setCurrentImageUrl(url: string | null) {
     if (currentImageUrl.value !== url) {
        currentImageUrl.value = url;
        // debatable if generating image counts as unsaved change to the *dream state*
        // hasUnsavedChanges.value = true; 
    }
  }
  // --------------------------------------

  // --- Action to mark state as saved ---
  function markAsSaved() {
      hasUnsavedChanges.value = false;
  }
  // -----------------------------------

  // --- Action to set the refresh function ---
  function setDreamsListRefresher(refreshFn: () => void) {
      _refreshDreamsList = refreshFn;
  }
  // ----------------------------------------

  // --- Action to trigger refresh ---
  function refreshDreamsList() {
      if (_refreshDreamsList) {
          console.log('Refreshing dreams list via store action...');
          _refreshDreamsList();
      } else {
          console.warn('refreshDreamsList called but no refresher function was set.');
      }
  }
  // -------------------------------

  return {
    tags,
    zones,
    focusedZone,
    zoneViewportStates, // Expose the raw map (or preferably through getters/setters if more control needed)
    saveZoneViewport,   // Expose action to save viewport
    getZoneViewport,    // Expose action/getter to retrieve viewport
    currentGeneratedPrompt,
    currentImageUrl,
    setFocusedZone,
    toggleTag: handleTagToggle,
    updateTagText,
    loadDreamState,           // Expose action
    resetToCurrentSession,    // Expose action
    markAsSaved,              // Expose action
    setCurrentGeneratedPrompt, // Expose action
    setCurrentImageUrl,      // Expose action
    graphNodes,
    graphLinks,
    loadedDreamId,            // Expose state
    hasUnsavedChanges,         // Expose state
    setDreamsListRefresher,    // Expose action
    refreshDreamsList          // Expose action
  };
});
