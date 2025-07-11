// stores/tagStore.ts
import { defineStore } from 'pinia'
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import type { Tag } from '~/types/tag'
import { initializeTags, getAvailableZones } from '~/services/tagProcessingService'
import { toggleTag } from '~/services/tagSelectionService'
import { computeGraphData } from '~/services/graphLayoutService'
import type { ViewportState } from '~/composables/useZoom'

// Interface for the saved dream data structure (subset of what's saved)
interface DreamData {
  focusedZone: string
  tags: Tag[]
  generatedPrompt?: string // Optional
  imageUrl?: string | null // Optional
  zoneViewports?: Record<string, ViewportState> // ADDED for saving/loading viewport states
}

// Interface for the image snapshot data
interface ImageSnapshot {
  id: number
  imageUrl: string
  promptText?: string | null
  createdAt: string
  dreamId: number
  graphState?: any
}

interface TagAppearance {
  id: string
  imageUrl: string
}

export const useTagStore = defineStore('tags', () => {
  const router = useRouter()
  const tags = ref<Tag[]>([])
  const zones = ref<string[]>(getAvailableZones())
  const focusedZone = ref<string>(zones.value[0] || 'Subject')
  const zoneViewportStates = ref<Map<string, ViewportState>>(new Map()) // New state for viewport per zone

  // --- Add state for prompt and image ---
  const currentGeneratedPrompt = ref<string>('')
  const currentImageUrl = ref<string | null>(null)
  const loadedDreamId = ref<number | null>(null) // Track loaded dream ID
  const hasUnsavedChanges = ref(false) // Track unsaved changes
  let _refreshDreamsList: (() => void) | null = null // Placeholder for refresh function

  // State for stashing current session when viewing an image snapshot
  const stashedSessionState = ref<DreamData | null>(null)
  const viewingSnapshotImageId = ref<number | null>(null) // ID of the image snapshot currently being viewed
  const pendingSnapshot = ref<ImageSnapshot | null>(null) // State to hold a snapshot pending a route change
  // ------------------------------------
  let initialTagsState: Tag[] = []

  async function initializeStore() {
    console.log('[TagStore] Initializing...')
    const baseTags = initializeTags()

    try {
      const response = await fetch('/api/tags/appearances')
      if (!response.ok) {
        throw new Error('Failed to fetch tag appearances')
      }
      const appearances: TagAppearance[] = await response.json()

      const appearanceMap = new Map(appearances.map((a: TagAppearance) => [a.id, a.imageUrl]))

      // Function to recursively apply image URLs
      const applyImageUrls = (tagsToProcess: Tag[]) => {
        for (const tag of tagsToProcess) {
          if (appearanceMap.has(tag.alias)) {
            tag.imageUrl = appearanceMap.get(tag.alias)
          }
          if (tag.children && tag.children.length > 0) {
            applyImageUrls(tag.children)
          }
        }
      }

      applyImageUrls(baseTags)
      console.log('[TagStore] Tag appearances merged successfully.')
    } catch (error) {
      console.error('[TagStore] Error fetching or merging tag appearances:', error)
      // Proceed with base tags even if fetching fails
    }

    tags.value = baseTags
    initialTagsState = JSON.parse(JSON.stringify(tags.value)) // Store initial state for reset
  }

  // Add session ID at the top with existing state
  const sessionId = ref<string>(generateSessionId())
  const isRequestInProgress = ref(false)
  const isRestoringSession = ref(false) // Flag to indicate a dream/snapshot load is in progress

  onMounted(() => {
    initializeStore()
  })

  // Helper function to generate unique session ID
  function generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  // Function to save viewport state for a zone
  function saveZoneViewport(zone: string, viewport: ViewportState) {
    zoneViewportStates.value.set(zone, viewport)
  }

  // Function to get viewport state for a zone
  function getZoneViewport(zone: string): ViewportState | undefined {
    return zoneViewportStates.value.get(zone)
  }

  // Getter to convert zoneViewportStates Map to a plain object for saving
  function getAllZoneViewportsObject(): Record<string, ViewportState> {
    const obj: Record<string, ViewportState> = {}
    for (const [key, value] of zoneViewportStates.value.entries()) {
      obj[key] = value
    }
    return obj
  }

  function setFocusedZone(zone: string) {
    sessionId.value = generateSessionId()
    focusedZone.value = zone
  }

  async function handleTagToggle(id: string) {
    // Skip tag toggle during session restoration to prevent overriding loaded state
    if (isRestoringSession.value) {
      console.log('[TAG TOGGLE] Skipping tag toggle during session restoration:', id)
      return
    }

    // Capture current session ID at the start of the request
    const currentSessionId = sessionId.value
    isRequestInProgress.value = true

    try {
      const originalSelectedState = tags.value.find((t) => t.id === id)?.selected
      const { updatedTags, selectedTag } = await toggleTag(id, tags.value)

      // Check if we're still in the same session before applying updates
      if (currentSessionId !== sessionId.value) {
        console.warn('Session changed during tag operation - discarding results')
        return
      }

      if (selectedTag.selected !== originalSelectedState) {
        hasUnsavedChanges.value = true
      }

      tags.value = updatedTags
      currentImageUrl.value = null
    } finally {
      isRequestInProgress.value = false
    }
  }

  function updateTagText(id: string, newText: string) {
    const tag = tags.value.find((t) => t.id === id)
    if (tag && tag.text !== newText) {
      tag.text = newText
      hasUnsavedChanges.value = true
    }
  }

  // Computed properties for graph visualization
  const graphNodes = computed(() => computeGraphData(tags.value, focusedZone.value).nodes)
  const graphLinks = computed(() => computeGraphData(tags.value, focusedZone.value).links)

  // --- Action to load a saved dream state ---
  async function loadDreamState(dreamData: DreamData, dreamId: number | null) {
    isRestoringSession.value = true
    tags.value = []
    currentGeneratedPrompt.value = ''
    currentImageUrl.value = null
    loadedDreamId.value = null
    hasUnsavedChanges.value = false
    sessionId.value = generateSessionId()
    zoneViewportStates.value = new Map<string, ViewportState>()

    if (dreamData.zoneViewports) {
      for (const [zoneName, viewportState] of Object.entries(dreamData.zoneViewports)) {
        // Simple validation for viewportState structure before setting
        if (
          viewportState &&
          typeof viewportState.x === 'number' &&
          typeof viewportState.y === 'number' &&
          typeof viewportState.k === 'number'
        ) {
          zoneViewportStates.value.set(zoneName, viewportState)
        } else {
          console.warn(
            `[TagStore] Invalid viewport data for zone '${zoneName}' in loaded dream:`,
            viewportState
          )
        }
      }
    }

    if (!dreamData || typeof dreamData !== 'object') {
      console.error('Invalid dream data provided to loadDreamState')
      return
    }

    const baseTags = initializeTags()
    const tagMap = new Map<string, Tag>()
    baseTags.forEach((t) => tagMap.set(t.id, t))

    const reconstructedTags: Tag[] = [...baseTags]

    // Overlay saved tag states
    dreamData.tags.forEach((savedTag, index) => {
      const existing = tagMap.get(savedTag.id)

      if (existing) {
        // Predefined tag: apply saved properties
        existing.selected = savedTag.selected
        if (savedTag.x !== undefined) existing.x = savedTag.x
        if (savedTag.y !== undefined) existing.y = savedTag.y

        // Handle transformation state for predefined tags
        if (savedTag.isTransformed) {
          existing.isTransformed = true
          existing.originalText = savedTag.originalText
          // If transformed, use the saved transformed text instead of the predefined text
          existing.text = savedTag.text
          // Clear predefined children for transformed tags - they should only have saved dynamic children
          existing.children = []
        }
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
          depth: savedTag.depth,
          isTransformed: savedTag.isTransformed || false,
          originalText: savedTag.originalText || undefined,
        }
        // Attach dynamic tag to its parent in base tags
        if (dynamicTag.parentId) {
          const parent = tagMap.get(dynamicTag.parentId)
          if (parent) {
            parent.children = parent.children ? [...parent.children, dynamicTag] : [dynamicTag]
          }
        }

        // Add to reconstructed tags and map
        reconstructedTags.push(dynamicTag)
        tagMap.set(dynamicTag.id, dynamicTag)
      }
    })

    // Set core state before applying tags
    loadedDreamId.value = dreamId
    focusedZone.value = dreamData.focusedZone || zones.value[0]
    currentGeneratedPrompt.value = dreamData.generatedPrompt || ''
    currentImageUrl.value = dreamData.imageUrl || null

    hasUnsavedChanges.value = false

    // Delay tag assignment to allow loader to display
    await nextTick()
    tags.value = reconstructedTags
    await nextTick()
    isRestoringSession.value = false
  }
  // ------------------------------------------

  // --- Action to reset to initial/current state ---
  async function resetToCurrentSession({ isNewDream = false }: { isNewDream?: boolean } = {}) {
    isRestoringSession.value = true
    tags.value = []
    sessionId.value = generateSessionId()
    zoneViewportStates.value = new Map<string, ViewportState>()
    loadedDreamId.value = null
    currentGeneratedPrompt.value = ''
    currentImageUrl.value = null

    const freshTagsData = isNewDream
      ? initializeTags()
      : JSON.parse(JSON.stringify(initialTagsState))
    freshTagsData.forEach((tag: Tag) => {
      delete tag.x
      delete tag.y
      if (tag.children) {
        tag.children.forEach((child: Tag) => {
          delete child.x
          delete child.y
        })
      }
    })

    focusedZone.value = zones.value[0]
    hasUnsavedChanges.value = false

    // Delay tag assignment
    await nextTick()
    tags.value = freshTagsData
    await nextTick()
    isRestoringSession.value = false
  }
  // ----------------------------------------------

  // --- Actions to set prompt and image --- (add unsaved changes flag)
  function setCurrentGeneratedPrompt(prompt: string, markDirty: boolean = true) {
    if (currentGeneratedPrompt.value !== prompt) {
      currentGeneratedPrompt.value = prompt
      if (markDirty) {
        hasUnsavedChanges.value = true
      }
    }
  }
  function setCurrentImageUrl(url: string | null) {
    currentImageUrl.value = url
    // Setting an image directly doesn't necessarily mean unsaved changes to the dream structure itself
    // unless this action is tied to other state modifications that should be saved.
    // For now, let's assume changing the displayed image is a transient UI state or part of a new generation flow.
  }
  // --------------------------------------

  // --- Action to mark state as saved ---
  function markAsSaved() {
    hasUnsavedChanges.value = false
  }
  // -----------------------------------

  // --- Action to update dream ID without reloading state ---
  function updateLoadedDreamId(dreamId: number) {
    loadedDreamId.value = dreamId
    hasUnsavedChanges.value = false
  }
  // -------------------------------------------------------

  // --- Action to set the refresh function ---
  function setDreamsListRefresher(refreshFn: () => void) {
    _refreshDreamsList = refreshFn
  }
  // ----------------------------------------

  // --- Action to trigger refresh ---
  function refreshDreamsList() {
    if (_refreshDreamsList) {
      console.log('Refreshing dreams list via store action...')
      _refreshDreamsList()
    } else {
      console.warn('refreshDreamsList called but no refresher function was set.')
    }
  }
  // -------------------------------

  // --- Action to load state from an image snapshot ---
  async function loadStateFromImageSnapshot(imageSnapshot: {
    id: number
    imageUrl: string
    promptText?: string
    graphState: any // This will be the { focusedZone, tags } object
  }) {
    isRestoringSession.value = true
    currentGeneratedPrompt.value = ''
    currentImageUrl.value = null
    sessionId.value = generateSessionId()

    if (
      !imageSnapshot ||
      !imageSnapshot.graphState ||
      typeof imageSnapshot.graphState !== 'object'
    ) {
      console.error('Invalid image snapshot or graphState provided to loadStateFromImageSnapshot')
      return
    }

    const { focusedZone: snapshotFocusedZone, tags: snapshotTags } = imageSnapshot.graphState

    if (!snapshotFocusedZone || !Array.isArray(snapshotTags)) {
      console.error('Invalid graphState structure in image snapshot')
      return
    }

    // IMPORTANT: Unlike loadDreamState, we do NOT clear loadedDreamId here.
    // We are loading a sub-state OF THE CURRENTLY LOADED DREAM (or new session).
    // Viewport states are also kept as they are, as this is a content change, not a dream project switch.

    // Update current image and prompt from the snapshot
    currentImageUrl.value = imageSnapshot.imageUrl
    currentGeneratedPrompt.value = imageSnapshot.promptText || ''

    // Recreate the base predefined tags to ensure a clean slate for merging
    const baseTags = initializeTags()
    const tagMap = new Map<string, Tag>()
    baseTags.forEach((t) => tagMap.set(t.id, { ...t, children: [] })) // Deep clone base tags and ensure children array exists

    const reconstructedTags: Tag[] = []
    const newTagMap = new Map<string, Tag>()

    // First, process all predefined tags from the snapshot, applying their state
    snapshotTags.forEach((savedTag) => {
      if (baseTags.some((bt) => bt.id === savedTag.id)) {
        // Check if it's a predefined tag
        const baseTagClone = { ...tagMap.get(savedTag.id)! } // Get the cloned base tag
        Object.assign(baseTagClone, {
          selected: savedTag.selected,
          x: savedTag.x,
          y: savedTag.y,
          // Ensure other relevant properties are maintained or overridden
          text: savedTag.text, // text of predefined tags can also be edited
          alias: savedTag.alias,
          size: savedTag.size,
          zone: savedTag.zone, // zone should match the predefined one
          isTransformed: savedTag.isTransformed || false,
          originalText: savedTag.originalText || undefined,
        })
        newTagMap.set(baseTagClone.id, baseTagClone)
        reconstructedTags.push(baseTagClone)
      }
    })

    // Now, process dynamic tags (those not in baseTags) and link them
    snapshotTags.forEach((savedTag) => {
      if (!baseTags.some((bt) => bt.id === savedTag.id)) {
        // It's a dynamic tag
        const dynamicTag: Tag = {
          id: savedTag.id,
          text: savedTag.text,
          size: savedTag.size,
          selected: savedTag.selected,
          zone: savedTag.zone,
          isTransformed: savedTag.isTransformed || false,
          originalText: savedTag.originalText || undefined,
          alias: savedTag.alias,
          parentId: savedTag.parentId,
          x: savedTag.x,
          y: savedTag.y,
          isLoading: savedTag.isLoading || false,
          children: [], // Initialize children for dynamic tags
          depth: savedTag.depth,
        }
        newTagMap.set(dynamicTag.id, dynamicTag)
        reconstructedTags.push(dynamicTag)
      }
    })

    // Reconstruct children relationships for all tags in newTagMap
    newTagMap.forEach((tag) => {
      if (tag.parentId) {
        const parent = newTagMap.get(tag.parentId)
        if (parent) {
          parent.children = parent.children || []
          if (!parent.children.some((child) => child.id === tag.id)) {
            parent.children.push(tag)
          }
        }
      }
    })

    // Set the focused zone from the snapshot
    focusedZone.value = snapshotFocusedZone
    // Set the reconstructed tags
    tags.value = reconstructedTags

    // Loading a snapshot implies a deviation from the last saved state of the *dream*
    // or the initial state of a *new session*.
    hasUnsavedChanges.value = true

    await nextTick()
    isRestoringSession.value = false
    router.replace({ query: { ...router.currentRoute.value.query, snapshot: imageSnapshot.id } })
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
    }
  }

  function restoreStashedSession() {
    if (!stashedSessionState.value) {
      console.warn('[TagStore] Attempted to restore session when none is stashed.')
      return
    }

    const sessionToRestore = stashedSessionState.value

    sessionId.value = generateSessionId()

    focusedZone.value = sessionToRestore.focusedZone
    tags.value = JSON.parse(JSON.stringify(sessionToRestore.tags))
    currentGeneratedPrompt.value = sessionToRestore.generatedPrompt || ''
    currentImageUrl.value = sessionToRestore.imageUrl || null

    // Restore viewports
    zoneViewportStates.value = new Map<string, ViewportState>()
    if (sessionToRestore.zoneViewports) {
      for (const [zoneName, viewportState] of Object.entries(sessionToRestore.zoneViewports)) {
        if (
          viewportState &&
          typeof viewportState.x === 'number' &&
          typeof viewportState.y === 'number' &&
          typeof viewportState.k === 'number'
        ) {
          zoneViewportStates.value.set(zoneName, viewportState)
        }
      }
    }
    hasUnsavedChanges.value = false

    // Clear the stash and viewing ID
    stashedSessionState.value = null
    viewingSnapshotImageId.value = null

    const { snapshot, ...queryWithoutSnapshot } = router.currentRoute.value.query
    router.replace({ query: queryWithoutSnapshot })
  }
  // -----------------------------------------------------------

  // --- Actions for pending snapshot ---
  function setPendingSnapshot(image: ImageSnapshot) {
    pendingSnapshot.value = image
  }

  function consumePendingSnapshot() {
    const snap = pendingSnapshot.value
    pendingSnapshot.value = null
    return snap
  }
  // ------------------------------------

  function reset() {
    tags.value = []
    focusedZone.value = 'core'
    currentGeneratedPrompt.value = ''
    currentImageUrl.value = null
    loadedDreamId.value = null
    stashedSessionState.value = null
    viewingSnapshotImageId.value = null
    hasUnsavedChanges.value = false
    isRestoringSession.value = false
    sessionId.value = generateSessionId()
    zoneViewportStates.value = new Map<string, ViewportState>()
  }

  return {
    tags,
    zones,
    focusedZone,
    isRestoringSession,
    zoneViewportStates,
    saveZoneViewport,
    getZoneViewport,
    currentGeneratedPrompt,
    currentImageUrl,
    setFocusedZone,
    toggleTag: handleTagToggle,
    updateTagText,
    loadDreamState,
    resetToCurrentSession,
    markAsSaved,
    updateLoadedDreamId,
    setCurrentGeneratedPrompt,
    setCurrentImageUrl,
    graphNodes,
    graphLinks,
    loadedDreamId,
    hasUnsavedChanges,
    sessionId,
    isRequestInProgress,
    setDreamsListRefresher,
    refreshDreamsList,
    loadStateFromImageSnapshot,
    getAllZoneViewportsObject,
    stashedSessionState,
    viewingSnapshotImageId,
    stashCurrentSession,
    restoreStashedSession,
    setPendingSnapshot,
    consumePendingSnapshot,
    reset,
  }
})
