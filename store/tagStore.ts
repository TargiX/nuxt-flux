// stores/tagStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useRuntimeConfig } from '#app';
import type { Tag } from '~/types/tag';
import { initializeTags, getAvailableZones } from '~/services/tagProcessingService';
import { toggleTag } from '~/services/tagSelectionService';
import { computeGraphData } from '~/services/graphLayoutService';
import type { ViewportState } from '~/composables/useZoom';

// Interface for the saved dream data structure (subset of what's saved)
interface DreamData {
  focusedZone: string;
  tags: Tag[];
  generatedPrompt?: string; // Optional
  imageUrl?: string | null; // Optional
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

  // Add session ID at the top with existing state
  const sessionId = ref<string>(generateSessionId());
  const isRequestInProgress = ref(false);

  // Initialize tags on store creation
  tags.value = initializeTags();
  const initialTagsState = JSON.parse(JSON.stringify(tags.value)); // Store initial state for reset

  // Helper function to generate unique session ID
  function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

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
    // Generate new session ID to invalidate any in-flight requests
    // This ensures that ongoing tag operations from the previous zone don't affect the new zone
    sessionId.value = generateSessionId();
    console.log(`Session changed to ${sessionId.value} when switching to ${zone}`);
    
    // Switching zones should not mark unsaved changes
    focusedZone.value = zone;
  }

  async function handleTagToggle(id: string) {
    // Capture current session ID at the start of the request
    const currentSessionId = sessionId.value;
    isRequestInProgress.value = true;
    
    try {
      const originalSelectedState = tags.value.find(t => t.id === id)?.selected;
      const { updatedTags, selectedTag } = await toggleTag(id, tags.value);
      
      // Check if we're still in the same session before applying updates
      if (currentSessionId !== sessionId.value) {
        console.warn("Session changed during tag operation - discarding results");
        return;
      }
      
      if (selectedTag.selected !== originalSelectedState) {
        hasUnsavedChanges.value = true;
      }
      
      tags.value = updatedTags;
      currentImageUrl.value = null;
    } finally {
      isRequestInProgress.value = false;
    }
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
    
    // Generate new session ID to invalidate any in-flight requests
    sessionId.value = generateSessionId();
    
    // Clear all previous data first to avoid leaking state
    // Completely replace viewport map - don't set any defaults
    zoneViewportStates.value = new Map<string, ViewportState>();
    
    loadedDreamId.value = null;
    currentGeneratedPrompt.value = '';
    currentImageUrl.value = null;
    hasUnsavedChanges.value = false;
    
    // Validate data
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

    // Clear tags value first to prevent stale data
    tags.value = [];

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

    // Set all data synchronously in the correct order
    loadedDreamId.value = dreamId; // Set ID first
    focusedZone.value = dreamData.focusedZone || zones.value[0];
    tags.value = reconstructedTags;
    currentGeneratedPrompt.value = dreamData.generatedPrompt || '';
    currentImageUrl.value = dreamData.imageUrl || null;
    hasUnsavedChanges.value = false;
    
    console.log("Dream state loaded synchronously.");
  }
  // ------------------------------------------

  // Helper function to clear session state
  function clearSessionState() {
    // Clear all previous data
    zoneViewportStates.value.clear();
    loadedDreamId.value = null;
    currentGeneratedPrompt.value = '';
    currentImageUrl.value = null;
    hasUnsavedChanges.value = false;
  }

  // --- Action to reset to initial/current state ---
  function resetToCurrentSession({isNewDream = false}: {isNewDream?: boolean} = {}) {
    console.log('Resetting to current session state');
    
    // Generate new session ID to invalidate any in-flight requests
    sessionId.value = generateSessionId();
    
    // Hard reset viewport state - completely replace the map
    zoneViewportStates.value = new Map<string, ViewportState>();
    // Don't set any default viewport - this will force the component to use its built-in default
    // which is properly calculated based on the SVG dimensions and initialZoomScale
    
    // First completely reset all state values
    loadedDreamId.value = null;
    currentGeneratedPrompt.value = '';
    currentImageUrl.value = null;
    
    // Create completely fresh tags with no previous state
    const freshTagsData = isNewDream ? initializeTags() : JSON.parse(JSON.stringify(initialTagsState));
    
    // Explicitly remove all position data from tags
    freshTagsData.forEach((tag: Tag) => {
      delete tag.x;
      delete tag.y;
      
      // Also reset any children
      if (tag.children) {
        tag.children.forEach((child: Tag) => {
          delete child.x;
          delete child.y;
        });
      }
    });
    
    // First clear the tags array - must happen before setting new tags
    tags.value = [];
    
    // Immediately set tags to fresh data - no timeout
    tags.value = freshTagsData;
    
    // Set focused zone to default
    focusedZone.value = zones.value[0];
    hasUnsavedChanges.value = false;
    
    console.log(`Reset completed with ${freshTagsData.length} fresh tags`);
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
    sessionId,                // Expose session ID for coordination
    isRequestInProgress,      // Expose request status
    setDreamsListRefresher,    // Expose action
    refreshDreamsList          // Expose action
  };
});
