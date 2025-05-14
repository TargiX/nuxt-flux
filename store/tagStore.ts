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
  zoneViewports?: Record<string, ViewportState>; // ADDED for saving/loading viewport states
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
  
  // State for stashing current session when viewing an image snapshot
  const stashedSessionState = ref<DreamData | null>(null);
  const viewingSnapshotImageId = ref<number | null>(null); // ID of the image snapshot currently being viewed
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

  // Getter to convert zoneViewportStates Map to a plain object for saving
  function getAllZoneViewportsObject(): Record<string, ViewportState> {
    const obj: Record<string, ViewportState> = {};
    for (const [key, value] of zoneViewportStates.value.entries()) {
      obj[key] = value;
    }
    return obj;
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
    
    sessionId.value = generateSessionId();
    
    zoneViewportStates.value = new Map<string, ViewportState>(); // Clear existing
    if (dreamData.zoneViewports) {
      for (const [zoneName, viewportState] of Object.entries(dreamData.zoneViewports)) {
        // Simple validation for viewportState structure before setting
        if (viewportState && typeof viewportState.x === 'number' && typeof viewportState.y === 'number' && typeof viewportState.k === 'number') {
          zoneViewportStates.value.set(zoneName, viewportState);
        } else {
          console.warn(`[TagStore] Invalid viewport data for zone '${zoneName}' in loaded dream:`, viewportState);
        }
      }
      console.log("[TagStore] Loaded zoneViewports from dream data:", zoneViewportStates.value);
    }
    
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
    currentImageUrl.value = url;
    // Setting an image directly doesn't necessarily mean unsaved changes to the dream structure itself
    // unless this action is tied to other state modifications that should be saved.
    // For now, let's assume changing the displayed image is a transient UI state or part of a new generation flow.
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

  // --- Action to load state from an image snapshot ---
  function loadStateFromImageSnapshot(imageSnapshot: { 
    imageUrl: string; 
    promptText?: string; 
    graphState: any; // This will be the { focusedZone, tags } object 
  }) {
    console.log("Loading state from image snapshot:", imageSnapshot);

    if (!imageSnapshot || !imageSnapshot.graphState || typeof imageSnapshot.graphState !== 'object') {
      console.error("Invalid image snapshot or graphState provided to loadStateFromImageSnapshot");
      return;
    }

    const { focusedZone: snapshotFocusedZone, tags: snapshotTags } = imageSnapshot.graphState;

    if (!snapshotFocusedZone || !Array.isArray(snapshotTags)) {
      console.error("Invalid graphState structure in image snapshot");
      return;
    }

    // Generate new session ID to invalidate any in-flight requests
    sessionId.value = generateSessionId();
    console.log(`Session changed to ${sessionId.value} when loading image snapshot`);

    // IMPORTANT: Unlike loadDreamState, we do NOT clear loadedDreamId here.
    // We are loading a sub-state OF THE CURRENTLY LOADED DREAM (or new session).
    // Viewport states are also kept as they are, as this is a content change, not a dream project switch.

    // Update current image and prompt from the snapshot
    currentImageUrl.value = imageSnapshot.imageUrl;
    currentGeneratedPrompt.value = imageSnapshot.promptText || '';

    // Recreate the base predefined tags to ensure a clean slate for merging
    const baseTags = initializeTags();
    const tagMap = new Map<string, Tag>();
    baseTags.forEach(t => tagMap.set(t.id, { ...t, children: [] })); // Deep clone base tags and ensure children array exists

    const reconstructedTags: Tag[] = [];
    const newTagMap = new Map<string, Tag>();

    // First, process all predefined tags from the snapshot, applying their state
    snapshotTags.forEach(savedTag => {
      if (baseTags.some(bt => bt.id === savedTag.id)) { // Check if it's a predefined tag
        const baseTagClone = { ...tagMap.get(savedTag.id)! }; // Get the cloned base tag
        Object.assign(baseTagClone, {
          selected: savedTag.selected,
          x: savedTag.x,
          y: savedTag.y,
          // Ensure other relevant properties are maintained or overridden
          text: savedTag.text, // text of predefined tags can also be edited
          alias: savedTag.alias,
          size: savedTag.size,
          zone: savedTag.zone, // zone should match the predefined one
        });
        newTagMap.set(baseTagClone.id, baseTagClone);
        reconstructedTags.push(baseTagClone);
      }
    });

    // Now, process dynamic tags (those not in baseTags) and link them
    snapshotTags.forEach(savedTag => {
      if (!baseTags.some(bt => bt.id === savedTag.id)) { // It's a dynamic tag
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
          children: [], // Initialize children for dynamic tags
          depth: savedTag.depth,
        };
        newTagMap.set(dynamicTag.id, dynamicTag);
        reconstructedTags.push(dynamicTag);
      }
    });

    // Reconstruct children relationships for all tags in newTagMap
    newTagMap.forEach(tag => {
      if (tag.parentId) {
        const parent = newTagMap.get(tag.parentId);
        if (parent) {
          parent.children = parent.children || [];
          if (!parent.children.some(child => child.id === tag.id)) {
             parent.children.push(tag);
          }
        }
      }
    });
    
    // Set the focused zone from the snapshot
    focusedZone.value = snapshotFocusedZone;
    // Set the reconstructed tags
    tags.value = reconstructedTags;

    // Loading a snapshot implies a deviation from the last saved state of the *dream*
    // or the initial state of a *new session*.
    hasUnsavedChanges.value = true; 

    console.log("State loaded from image snapshot. Focused zone:", focusedZone.value);
  }
  // --------------------------------------------------

  // --- Stash and Restore Session for Image Snapshot Viewing ---
  function stashCurrentSession() {
    if (stashedSessionState.value) {
      // console.warn("[TagStore] Attempted to stash session when one is already stashed. This might indicate an issue.");
      // Overwriting is probably fine if the user clicks another snapshot while already viewing one.
      // The key is that the *original* session before *any* snapshot viewing is what we want to keep if possible,
      // but this function is just about capturing the *current* state.
    }
    stashedSessionState.value = {
      focusedZone: focusedZone.value,
      tags: JSON.parse(JSON.stringify(tags.value)), // Deep clone
      generatedPrompt: currentGeneratedPrompt.value,
      imageUrl: currentImageUrl.value,
      zoneViewports: getAllZoneViewportsObject(),
    };
    console.log("[TagStore] Current session stashed:", stashedSessionState.value);
  }

  function restoreStashedSession() {
    if (!stashedSessionState.value) {
      console.warn("[TagStore] Attempted to restore session when none is stashed.");
      return;
    }

    console.log("[TagStore] Restoring stashed session...");
    const sessionToRestore = stashedSessionState.value;

    // Effectively, this is like loading a dream state but without a dreamId
    // and without affecting loadedDreamId.
    sessionId.value = generateSessionId(); // New session for the restored state

    focusedZone.value = sessionToRestore.focusedZone;
    tags.value = JSON.parse(JSON.stringify(sessionToRestore.tags)); // Deep clone
    currentGeneratedPrompt.value = sessionToRestore.generatedPrompt || '';
    currentImageUrl.value = sessionToRestore.imageUrl || null;

    // Restore viewports
    zoneViewportStates.value = new Map<string, ViewportState>();
    if (sessionToRestore.zoneViewports) {
      for (const [zoneName, viewportState] of Object.entries(sessionToRestore.zoneViewports)) {
        if (viewportState && typeof viewportState.x === 'number' && typeof viewportState.y === 'number' && typeof viewportState.k === 'number') {
          zoneViewportStates.value.set(zoneName, viewportState);
        }
      }
    }
    console.log("[TagStore] ZoneViewports after restoring stashed session:", zoneViewportStates.value);

    hasUnsavedChanges.value = false; // Restored state is considered saved/pristine relative to itself
                                  // Or, we might want to preserve the hasUnsavedChanges from the stashed state?
                                  // For now, treating it as a clean load.

    // Clear the stash and viewing ID
    stashedSessionState.value = null;
    viewingSnapshotImageId.value = null;
    console.log("[TagStore] Stashed session restored and cleared.");
  }
  // -----------------------------------------------------------

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
    refreshDreamsList,         // Expose action
    loadStateFromImageSnapshot, // Expose action
    getAllZoneViewportsObject,  // Expose new getter
    stashedSessionState,        // EXPOSE
    viewingSnapshotImageId,   // EXPOSE
    stashCurrentSession,      // EXPOSE ACTION
    restoreStashedSession,    // EXPOSE ACTION
  };
});
