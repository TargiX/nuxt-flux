<template>
  <!-- Log the computed value for debugging in template -->
  <!-- <div>[TagCloud Template] isRestoring: {{ છેRestoringSessionDebug.value }}</div> -->
  <OnboardingTutorial ref="tutorialRef" />
  <div v-if="!isRestoringSessionForTemplate" class="main-zone grid tw-gap-4">
    <!-- Top: Graph/Image Container (Full Width) -->
    <div class="graph-container glass-card">
      <div class="flex justify-between items-center w-full mb-4">
        <h2 class="zone-title m-0">
          {{ currentViewMode === 'graph' ? focusedZone : 'Image Preview' }}
        </h2>
        <!-- <SelectButton 
          v-model="currentViewMode" 
          :options="viewModeOptions" 
          optionLabel="label" 
          optionValue="value"
          class="view-mode-toggle"
        /> -->
      </div>

      <!-- Graph View -->
      <ForceGraph
        v-if="currentViewMode === 'graph'"
        ref="forceGraphRef"
        :width="800"
        :height="600"
        :nodes="localGraphNodes"
        :links="localGraphLinks"
        :is-graph-loading="tagStore.isRestoringSession"
        class="w-full flex-grow"
        @node-click="handleNodeClick"
        @node-positions-updated="handleNodePositionsUpdated"
        @node-text-updated="handleNodeTextUpdated"
        @menu-action="handleNodeContextMenu"
      >
        <!-- Zone selector will be moved here via slot later -->
        <template #controls>
          <div class="zone-selector-container mt-4">
            <ZoneSelector
              v-model:model-value="selectedZone"
              :options="zoneOptionsWithCounts"
              option-label="name"
              option-value="name"
            />
          </div>
        </template>
      </ForceGraph>

      <!-- Image Preview View -->
      <div
        v-else
        class="image-preview-view w-full h-full flex flex-col items-center justify-center flex-grow"
      >
        <div class="flex justify-between items-center mb-2 w-full">
          <h3>Current Image:</h3>
          <Button
            v-if="tagStore.currentImageUrl"
            v-tooltip.top="'Download image'"
            severity="secondary"
            text
            size="small"
            class="w-8 h-8 !p-0 flex items-center justify-center"
            @click="handleDownloadImage"
          >
            <i class="pi pi-download text-sm"/>
          </Button>
        </div>
        <div class="large-image-container">
          <img
            v-if="tagStore.currentImageUrl"
            :src="tagStore.currentImageUrl"
            alt="Generated Image"
            class="large-generated-image"
          >
          <div v-else class="large-placeholder-container">
            <i class="pi pi-image text-6xl mb-4 opacity-50"/>
            <p class="text-lg opacity-75">No image generated yet</p>
            <p class="text-sm opacity-50">Generate an image to see it here</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Left: Prompt Area -->
    <div class="prompt-area-container glass-card">
      <div class="prompt-header flex justify-between items-start w-full">
        <h2>Generated Prompt:</h2>
        <div class="flex items-center gap-2">
          <Button
            v-if="isViewingSnapshot"
            v-tooltip.top="'Use this snapshot as your live session'"
            label="Apply Snapshot"
            icon="pi pi-check-square"
            severity="success"
            text
            size="small"
            class="px-2 py-1 h-8"
            @click="handleApplySnapshot"
          />
          <Button
            v-if="tagStore.stashedSessionState"
            v-tooltip.top="'Return to your live session'"
            label="Exit Snapshot View"
            icon="pi pi-replay"
            severity="info"
            text
            size="small"
            class="px-2 py-1 h-8"
            @click="tagStore.restoreStashedSession()"
          />
          <Button
            v-if="!isManualMode && generatedPrompt && devMode && !isViewingSnapshot"
            v-tooltip.top="'Regenerate prompt'"
            icon="pi pi-refresh"
            severity="secondary"
            text
            size="small"
            class="w-7 h-7 !p-0 flex items-center justify-center"
            :class="{ 'animate-spin': isGeneratingPrompt }"
            :disabled="isGeneratingPrompt"
            @click="handleRefreshPrompt"
          />
          <ToggleButton
            v-if="!isViewingSnapshot"
            v-model="isManualMode"
            on-label="Auto"
            class="px-1 py-1 h-8"
            off-label="Manual"
            on-icon="pi pi-lock"
            off-icon="pi pi-lock-open"
            :disabled="isViewingSnapshot"
          />
        </div>
      </div>
      <div class="prompt-box w-full max-h-[100px] overflow-y-auto">
        <Textarea
          v-if="isManualMode"
          v-model="manualPrompt"
          class="manual-prompt-input text-[var(--text-color-secondary)] h-[calc(100%-10px)] w-full p-2"
          placeholder="Enter your prompt..."
          :disabled="isViewingSnapshot"
        />
        <p
          v-else
          class="text-white-palette prompt-text"
          :class="{ 'fade-in': !isGeneratingPrompt, 'fade-out': isGeneratingPrompt }"
        >
          {{ tagStore.currentGeneratedPrompt }}
        </p>
      </div>
      <div class="flex justify-between items-center w-full mt-2">
        <!-- Selected tags badges with remove icon -->
        <div class="flex flex-wrap gap-1 flex-grow">
          <Tag v-for="tag in selectedTags" :key="tag.id" severity="info" class="px-1">
            <div class="flex items-center gap-2">
              <span class="truncate max-w-[80px]">{{ tag.text }}</span>
              <i
                v-if="!isViewingSnapshot"
                class="pi pi-times cursor-pointer"
                @click.stop="removeTag(tag)"
              />
            </div>
          </Tag>
        </div>
        <div class="flex gap-2">
          <Button
            v-if="!isViewingSnapshot"
            v-tooltip.top="'Save session'"
            severity="info"
            :disabled="isSavingDisabled"
            class="flex items-center justify-center !w-8 !h-8 !p-0 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700"
            @click="handleSaveDreamClick"
          >
            <!-- Show spinner when saving, otherwise show floppy disk icon -->
            <LoadingSpinner
              v-if="isSavingDreamFromComposable"
              :width="16"
              :height="16"
              stroke-width="8"
            />
            <!-- Custom floppy disk icon -->
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="flex-shrink-0"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2z" />
              <polyline points="17,21 17,13 7,13 7,21" />
              <polyline points="7,3 7,8 15,8" />
            </svg>
          </Button>
          <Button
            v-if="!isViewingSnapshot"
            severity="primary"
            :disabled="isGenerationDisabled"
            class="flex items-center gap-2 flex-nowrap whitespace-nowrap !h-8 px-3"
            @click="handleGenerateImageClick"
          >
            <!-- Show spinner when generating, otherwise show generate icon -->
            <LoadingSpinner
              v-if="isGeneratingImageFromComposable"
              :width="16"
              :height="16"
              stroke-width="8"
            />
            <svg
              v-else
              width="16"
              height="16"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              class="flex-shrink-0"
            >
              <path
                d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Zm9-3a.75.75 0 0 1 .728.568l.258 1.036a2.63 2.63 0 0 0 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a2.63 2.63 0 0 0-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.624 2.624 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395a1.5 1.5 0 0 0-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395a1.5 1.5 0 0 0 .948-.948l.395-1.183a.75.75 0 0 1 .71-.513Z"
                fill="currentColor"
              />
            </svg>
            <span class="text-sm">
              {{
                isGeneratingImageFromComposable
                  ? 'Generating...'
                  : isImageCooldownFromComposable
                  ? 'Cooldown...'
                  : 'Generate Image'
              }}
            </span>
          </Button>
        </div>
      </div>
      <!-- Model Picker Row -->
      <div v-if="!isViewingSnapshot" class="flex justify-between items-center w-full mt-2">
        <div class="text-sm text-gray-400">
          AI Model:
        </div>
        <ModelPicker
          v-model="selectedModel"
          compact
          @change="handleModelChange"
        />
      </div>
    </div>

    <!-- Bottom Right: Vertical Image Strip -->
    <div class="image-strip-container glass-card">
      <ImageStrip
        ref="imageStripRef"
        :dream-id="tagStore.loadedDreamId"
        :viewing-snapshot-id="tagStore.viewingSnapshotImageId"
        :is-generating-image="isGeneratingImageFromComposable"
        @image-clicked="openImageViewerFromStrip"
        @snapshot-requested="handleSnapshotRequestFromStrip"
      />
    </div>
  </div>
  <div v-else class="loading-session-indicator">
    <ProgressSpinner
      style="width: 50px; height: 50px"
      stroke-width="8"
      fill="var(--surface-ground)"
      animation-duration=".5s"
      aria-label="Loading session"
    />
    <p>Loading session...</p>
  </div>
  <ImageViewerModal
    v-model="viewerVisible"
    :images="viewerImages"
    :start-index="viewerStartIndex"
    context="dream-session"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
import { useTagStore } from '~/store/tagStore'
import ForceGraph from './ForceGraph.vue'
import ZoneSelector from './ZoneSelector.vue'
import ImageStrip from './ImageStrip.vue'
import ImageViewerModal from './ImageViewerModal.vue'
import ModelPicker from './ModelPicker.vue'
import { generateImagePrompt, clearPromptCache } from '~/services/promptGenerationService'
import {
  transformNodeConcept,
  generateConceptTagsForTransformed,
} from '~/services/tagSelectionService'
import { useImageGeneration } from '~/composables/useImageGeneration'
import type { Tag as TagType } from '~/types/tag'
import type { ViewportState } from '~/composables/useZoom'
import { useDreamManagement } from '~/composables/useDreamManagement'
import LoadingSpinner from './LoadingSpinner.vue'
import OnboardingTutorial from './OnboardingTutorial.vue'
import { useConfirm } from 'primevue/useconfirm'
import { useImageDownloader } from '~/composables/useImageDownloader'
import ProgressSpinner from 'primevue/progressspinner'
import { useRoute } from 'vue-router'
import type { Dream } from '~/types/dream'
import { getDefaultModel } from '~/services/modelConfigService'
import { getUserPreferredModelForNewDream, getDreamLastUsedModel } from '~/services/modelPreferenceService'

const tagStore = useTagStore()
const toast = useToast()
const confirm = useConfirm()
const { downloadImage } = useImageDownloader()
const route = useRoute()

// Use the dream management composable
const {
  isSavingDream: isSavingDreamFromComposable,
  initiateSaveDreamProcess,
  performSaveAsNew,
} = useDreamManagement()

// Use the image generation composable
const {
  isGeneratingImage: isGeneratingImageFromComposable,
  isImageCooldown: isImageCooldownFromComposable,
  generateImageAndSave,
} = useImageGeneration()

const forceGraphRef = ref<InstanceType<typeof ForceGraph> | null>(null)
const imageStripRef = ref<InstanceType<typeof ImageStrip> | null>(null)
const viewerVisible = ref(false)
const viewerImages = ref<any[]>([])
const viewerStartIndex = ref(0)


const localGraphNodes = computed(() => (tagStore.isRestoringSession ? [] : tagStore.graphNodes))
const localGraphLinks = computed(() => tagStore.graphLinks)

const isRestoringSessionForTemplate = computed(() => tagStore.isRestoringSession)

const focusedZone = computed(() => tagStore.focusedZone)

const selectedZone = ref(focusedZone.value)

// Compute counts of selected nodes per zone
const zoneSelectedNodeCounts = computed(() => {
  const counts: Record<string, number> = {}
  tagStore.zones.forEach((zone) => (counts[zone] = 0)) // Initialize all zones with 0

  tagStore.tags.forEach((tag) => {
    if (tag.selected && tag.zone && counts[tag.zone] !== undefined) {
      counts[tag.zone]++
    }
  })
  return counts
})

// Create options for ZoneSelector that include the counts
const zoneOptionsWithCounts = computed(() => {
  return tagStore.zones.map((zoneName) => ({
    name: zoneName,
    count: zoneSelectedNodeCounts.value[zoneName] || 0,
  }))
})

// First let's add a zone change tracking flag
const isZoneSwitching = ref(false)
const devMode = ref(false)

watch(
  () => tagStore.loadedDreamId,
  (_newId, _oldId) => {
    // if (newId !== oldId) {
    //   // skipPrompt.value = true;
    // }
  }
)

const isManualMode = ref(false)
const manualPrompt = ref('')
// const isGeneratingImage = ref(false) // REMOVED - Use from composable
// const isImageCooldown = ref(false) // REMOVED - Use from composable
const isGeneratingPrompt = ref(false)
const selectedModel = ref(getDefaultModel())

// Initialize model based on user preferences and dream state
async function initializeSelectedModel() {
  try {
    const currentDreamId = tagStore.loadedDreamId
    
    if (currentDreamId) {
      // Try to get the last used model for this dream
      const lastUsedModel = await getDreamLastUsedModel(currentDreamId)
      if (lastUsedModel) {
        selectedModel.value = lastUsedModel
        return
      }
    }
    
    // For new dreams or if no last used model, get user's preferred model
    const { data: session } = await $fetch('/api/auth/session')
    if (session?.user?.id) {
      const preferredModel = await getUserPreferredModelForNewDream(session.user.id)
      selectedModel.value = preferredModel
    }
  } catch (error) {
    console.error('Failed to initialize selected model:', error)
    // Keep default model on error
  }
}

const isViewingSnapshot = computed(() => tagStore.viewingSnapshotImageId !== null)

let promptRequestId = 0
// let imageRequestId = 0 // REMOVED - Managed by composable

const isGenerationDisabled = computed(() => {
  // Use states from image generation composable
  return (
    !(isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt) ||
    isGeneratingImageFromComposable.value ||
    isSavingDreamFromComposable.value ||
    isImageCooldownFromComposable.value
  )
})

const isSavingDisabled = computed(() => {
  // Disabled if currently saving, or if no tags are selected (for new dream),
  // or if there are no unsaved changes (for existing or new).
  return (
    isSavingDreamFromComposable.value ||
    (tagStore.tags.filter((t) => t.selected).length === 0 && tagStore.loadedDreamId === null) ||
    !tagStore.hasUnsavedChanges
  )
})

const generatedPrompt = computed(() => {
  const allSelectedTags = tagStore.tags
    .filter((tag) => tag.selected)
    .map((tag) => tag.text)
    .sort()
  return allSelectedTags.join(', ')
})

watch(focusedZone, (newZone) => {
  selectedZone.value = newZone
})

// Check the zone watcher to add the zone switching protection
watch(selectedZone, (newZone, oldZone) => {
  if (newZone && newZone !== oldZone) {
    // Set flag to prevent prompt generation during zone switch
    isZoneSwitching.value = true
    switchToZone(newZone, oldZone || tagStore.focusedZone)
    // Reset the flag after a delay to allow zone switch to complete
    setTimeout(() => {
      isZoneSwitching.value = false
    }, 500)
  }
})

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func.apply(this, args)
      timeout = null
    }, wait)
  }
}

// Update the triggerPromptGeneration function to check for zone switching
const triggerPromptGeneration = debounce(async () => {
  // Skip prompt generation if we're in manual mode, already generating,
  // during zone switching, or if a session is currently being restored.
  if (
    isManualMode.value ||
    isGeneratingPrompt.value ||
    isZoneSwitching.value ||
    tagStore.isRestoringSession
  ) {
    return
  }

  const tagsString = generatedPrompt.value
  if (tagsString.length > 0) {
    isGeneratingPrompt.value = true
    const currentRequestId = ++promptRequestId
    try {
      const result = await generateImagePrompt(tagsString)
      // Check again if zone has changed during generation
      if (currentRequestId === promptRequestId && !isZoneSwitching.value) {
        tagStore.setCurrentGeneratedPrompt(result, false)
      }
    } catch (error) {
      console.error('Failed to generate prompt:', error)
      if (currentRequestId === promptRequestId && !isZoneSwitching.value) {
        tagStore.setCurrentGeneratedPrompt('Error generating prompt.', false)
        toast.add({
          severity: 'error',
          summary: 'Prompt Generation Failed',
          detail: (error as Error).message || 'Could not generate prompt. Please try again.',
          life: 5000,
        })
      }
    } finally {
      if (currentRequestId === promptRequestId) {
        isGeneratingPrompt.value = false
      }
    }
  } else {
    tagStore.setCurrentGeneratedPrompt('')
  }
}, 300)

// Skip generation once after load, then resume normal behavior
watch(generatedPrompt, () => {
  // Also check isRestoringSession here before triggering
  if (!tagStore.isRestoringSession) {
    triggerPromptGeneration()
  }
})

onMounted(() => {
  // The page component `[dreamId].vue` now handles all initial data loading.
  // This component just needs to react to the store.
  // We still need to check for a snapshot on mount.
  handleInitialSnapshot()
  
  // Initialize the selected model based on current dream state
  initializeSelectedModel()
})

// New, robust function to handle initial snapshot from URL
async function handleInitialSnapshot() {
  const snapshotIdStr = route.query.snapshot as string
  if (!snapshotIdStr) return

  // 1. Wait for the dream to be loaded by the parent page.
  if (!tagStore.loadedDreamId) {
    await new Promise((resolve) => {
      const unwatch = watch(
        () => tagStore.loadedDreamId,
        (newId) => {
          if (newId) {
            unwatch()
            resolve(newId)
          }
        }
      )
    })
  }

  // 2. Wait for the image strip to contain images.
  if (!imageStripRef.value?.images || imageStripRef.value.images.length === 0) {
    await new Promise((resolve) => {
      const unwatch = watch(
        () => imageStripRef.value?.images,
        (newImages) => {
          if (newImages && newImages.length > 0) {
            unwatch()
            resolve(newImages)
          }
        }
      )
    })
  }

  // 3. Now that data is ready, apply the snapshot.
  const snapshotId = parseInt(snapshotIdStr, 10)
  if (!imageStripRef.value) return // Guard against null ref
  const images = imageStripRef.value.images
  const snapshotImage = images.find((img) => img.id === snapshotId)

  if (snapshotImage && snapshotImage.graphState) {
    if (!tagStore.stashedSessionState) {
      tagStore.stashCurrentSession()
    }
    tagStore.loadStateFromImageSnapshot({
      id: snapshotImage.id,
      imageUrl: snapshotImage.imageUrl,
      promptText: snapshotImage.promptText,
      graphState: snapshotImage.graphState,
    })
  }
}

// Update the handleNodeClick function to be aware of session state
async function handleNodeClick(id: string) {
  if (isViewingSnapshot.value) {
    toast.add({
      severity: 'info',
      summary: 'Read-only',
      detail: 'Currently viewing a snapshot. Exit snapshot view to make changes.',
      life: 3000,
    })
    return
  }
  if (tagStore.isRequestInProgress) {
    return
  }

  if (tagStore.stashedSessionState) {
    tagStore.stashedSessionState = null // Clear stash
    tagStore.viewingSnapshotImageId = null // Clear viewing ID
    // The current state is now the live session
  }

  promptRequestId++
  try {
    await tagStore.toggleTag(id)
    // Explicitly trigger prompt generation after tags have been updated
    triggerPromptGeneration()
  } catch (error) {
    console.error('Error toggling tag or generating related tags:', error)
    toast.add({
      severity: 'error',
      summary: 'Tag Action Failed',
      detail: (error as Error).message || 'Could not toggle tag or generate related tags. Please try again.',
      life: 5000,
    })
  }
}

// Modify the loadedDreamId watcher to use synchronous reset
watch(
  () => tagStore.loadedDreamId,
  (newId, oldId) => {
    // Skip viewport operations ONLY if we're updating after a save AND isRestoringSession is false
    // This means we're just updating the ID after saving, not loading a new dream
    if (oldId === null && typeof newId === 'number' && !tagStore.isRestoringSession) {
      return
    }

    // Reset all prompt-related state when loading a new dream or clearing to new session
    promptRequestId++ // Cancel any pending prompt operations
    
    // Initialize the selected model for the new dream state
    initializeSelectedModel()

    // Reset cooldowns and generation states
    isGeneratingPrompt.value = false

    if (tagStore.stashedSessionState) {
      // No need to restore, just clear. The new dream/session takes precedence.
      tagStore.stashedSessionState = null
      tagStore.viewingSnapshotImageId = null
    }

    // Apply viewport for the newly loaded dream's focused zone
    // Use a retry mechanism to wait for ForceGraph to be ready
    const applyViewportWhenReady = () => {
      if (!forceGraphRef.value) {
        setTimeout(applyViewportWhenReady, 50)
        return
      }
      
      const savedViewport = tagStore.getZoneViewport(tagStore.focusedZone)
      if (isValidViewport(savedViewport)) {
        forceGraphRef.value.applyViewport(savedViewport)
      } else {
        forceGraphRef.value.applyViewport()
      }
    }
    
    nextTick(() => {
      applyViewportWhenReady()
    })
  }
)


// Fix switchToZone to properly handle default viewport
async function switchToZone(newZone: string, oldZone?: string) {
  // Cancel any running prompt generation by incrementing the request ID
  promptRequestId++

  // Skip prompt generation during zone switch
  isZoneSwitching.value = true

  const currentOldZone = oldZone || tagStore.focusedZone

  // Save viewport of the zone we're leaving
  if (forceGraphRef.value && currentOldZone) {
    const currentViewport = forceGraphRef.value.getCurrentViewport()
    if (currentViewport) {
      tagStore.saveZoneViewport(currentOldZone, currentViewport)
    }
  }

  tagStore.setFocusedZone(newZone)

  // Wait for the zone change to be processed
  await nextTick()

  // Apply the viewport for the new zone, if available
  if (forceGraphRef.value) {
    try {
      const savedViewport = tagStore.getZoneViewport(newZone)
      if (savedViewport) {
        // Validate the saved viewport
        if (isValidViewport(savedViewport)) {
          forceGraphRef.value.applyViewport(savedViewport)
        } else {
          console.warn(`Invalid viewport for ${newZone}, applying default`)
          forceGraphRef.value.applyViewport()
        }
      } else {
        forceGraphRef.value.applyViewport()
      }
    } catch (err) {
      console.error('Error applying viewport:', err)
      // Fallback to default viewport on error
      forceGraphRef.value.applyViewport()
    }
  }

  // Re-enable prompt generation - no timeout
  isZoneSwitching.value = false
}

// Add a function to validate viewport states
function isValidViewport(viewport: ViewportState | null | undefined): boolean {
  // Check for NaN or invalid values
  if (viewport === null || viewport === undefined) return false

  const { x, y, k } = viewport

  // Check if properties exist and are valid numbers
  if (typeof x !== 'number' || typeof y !== 'number' || typeof k !== 'number') {
    return false
  }

  // Check for NaN, infinity, or zero scale which would break viewport
  if (isNaN(x) || isNaN(y) || isNaN(k) || !isFinite(x) || !isFinite(y) || !isFinite(k) || k <= 0) {
    return false
  }

  return true
}

// Helper function to construct dream data payload
function getDreamDataPayload() {

  // CRITICAL: Capture current viewport before saving to ensure coordinates are preserved
  if (forceGraphRef.value) {
    const currentViewport = forceGraphRef.value.getCurrentViewport()
    if (currentViewport) {
      tagStore.saveZoneViewport(tagStore.focusedZone, currentViewport)
    }
  }


  // Create a proper deep clone that preserves all properties
  const plainTags = tagStore.tags.map((tag, index) => {
    const mapped = {
      id: tag.id,
      text: tag.text,
      size: tag.size,
      selected: tag.selected,
      zone: tag.zone,
      alias: tag.alias,
      parentId: tag.parentId,
      x: tag.x,
      y: tag.y,
      isLoading: tag.isLoading || false,
      depth: tag.depth,
      isTransformed: tag.isTransformed || false,
      originalText: tag.originalText || undefined,
    }

    return mapped
  })



  const payload = {
    focusedZone: focusedZone.value,
    tags: plainTags,
    generatedPrompt: tagStore.currentGeneratedPrompt,
    imageUrl: tagStore.currentImageUrl,
    zoneViewports: tagStore.getAllZoneViewportsObject(),
  }

  return payload
}

// New handler for the save button
async function handleSaveDreamClick() {
  if (isSavingDisabled.value) return

  const dreamDataPayload = getDreamDataPayload()
  await initiateSaveDreamProcess(dreamDataPayload, selectedModel.value)
}

// Update manual prompt values when loading dreams
watch(
  () => tagStore.currentGeneratedPrompt,
  (newPrompt) => {
    if (newPrompt && isManualMode.value) {
      manualPrompt.value = newPrompt
    }
  }
)

// Watch for store session changes to reset local flags
watch(
  () => tagStore.sessionId,
  () => {
    // Reset any local state when the store's session changes
    promptRequestId++
    isZoneSwitching.value = false

    // Simple synchronous operation - don't use timeouts that cause race conditions
    // skipPrompt.value = false;
  }
)



// Handle request to view a snapshot from the strip
const handleSnapshotRequestFromStrip = (image: {
  id: number
  imageUrl: string
  promptText?: string
  graphState?: any
}) => {
  if (image && image.imageUrl) {
    if (tagStore.viewingSnapshotImageId === image.id) {
      toast.add({
        severity: 'info',
        summary: 'Snapshot Info',
        detail: 'This snapshot is already being viewed. Exit or apply it to continue.',
        life: 4000,
      })
      return
    }
    // If we're not already viewing a snapshot, stash the current session.
    // If we are, the original session is already stashed.
    if (!tagStore.stashedSessionState) {
      tagStore.stashCurrentSession()
    }

    // It's important to set the image URL *before* loading the snapshot state,
    // as loadStateFromImageSnapshot might also set currentImageUrl.
    // However, the snapshot is the source of truth for the image being viewed.
    // tagStore.setCurrentImageUrl(image.imageUrl); // This will be handled by loadStateFromImageSnapshot

    tagStore.loadStateFromImageSnapshot(image)
    tagStore.viewingSnapshotImageId = image.id // Update store state

    // The rest of the logic for updating manualPrompt etc. from image.promptText
    // should ideally be inside loadStateFromImageSnapshot or triggered by it if needed.
    if (isManualMode.value && image.promptText) {
      manualPrompt.value = image.promptText
    } else if (!isManualMode.value && image.promptText) {
      // loadStateFromImageSnapshot already sets currentGeneratedPrompt
      // tagStore.setCurrentGeneratedPrompt(image.promptText, true);
    }
    // nextTick for graph updates can remain if still necessary after store changes
    nextTick(() => {
      if (forceGraphRef.value) {
        /* Potentially update graph if needed */
      }
    })
  } else if (tagStore.viewingSnapshotImageId === image?.id) {
    // If the *currently selected* snapshot image is clicked again, restore session.
    // This provides a way to exit snapshot view by clicking the selected image again.
    if (tagStore.stashedSessionState) {
      tagStore.restoreStashedSession()
    }
  }
}

function openImageViewerFromStrip(payload: { image: Dream; index: number }) {
  const imgs = imageStripRef.value?.images || []
  viewerImages.value = imgs
  viewerStartIndex.value = payload.index
  viewerVisible.value = true
}

// New handler for the Generate Image button
async function handleGenerateImageClick() {
  const promptText = isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt

  if (isViewingSnapshot.value) {
    toast.add({
      severity: 'info',
      summary: 'Read-only',
      detail: 'Cannot generate images while viewing a snapshot. Exit snapshot view first.',
      life: 3000,
    })
    return
  }

  if (
    !promptText ||
    isGeneratingImageFromComposable.value ||
    isImageCooldownFromComposable.value ||
    isSavingDreamFromComposable.value
  ) {
    return
  }

  if (tagStore.stashedSessionState) {
    tagStore.stashedSessionState = null
    tagStore.viewingSnapshotImageId = null
  }

  let currentDreamId = tagStore.loadedDreamId

  // If it's a new session, we must save it first to get a dream ID.
  if (currentDreamId === null) {
    const dreamDataPayload = getDreamDataPayload()

    // Directly call performSaveAsNew for a streamlined, non-interactive save.
    const newDream = await performSaveAsNew(dreamDataPayload, tagStore)

    if (newDream && newDream.id) {
      currentDreamId = newDream.id
      // CRITICAL: Update the URL silently without triggering Vue Router reactivity
      // The store's loadedDreamId is already updated by performSaveAsNew, 
      // so we just need to sync the browser URL for the side menu
      window.history.replaceState(null, '', `/dream/${currentDreamId}`)
    } else {
      console.error(
        '[TagCloud] Auto-save initiated but failed to return a new dream. Aborting image generation.'
      )
      toast.add({
        severity: 'error',
        summary: 'Save Failed',
        detail: 'Failed to auto-save session. Image generation aborted.',
        life: 5000,
      })
      return
    }
  }

  if (currentDreamId === null) {
    console.error('[TagCloud] Dream ID is critically null before generating image. Aborting.')
    toast.add({
      severity: 'error',
      summary: 'Internal Error',
      detail: 'Dream ID is missing. Cannot generate image.',
      life: 5000,
    })
    return
  }

  const newImageObject = await generateImageAndSave(
    promptText,
    currentDreamId,
    focusedZone.value,
    tagStore.tags,
    selectedModel.value
  )

  if (newImageObject && imageStripRef.value) {
    // Instead of refetching, prepend the new image
    imageStripRef.value.prependImage(newImageObject)
    // Potentially show a success toast here if not shown in the composable
    // toast.add({
    //   severity: 'success',
    //   summary: 'Image Generated & Saved',
    //   detail: `New image added to Dream ID: ${currentDreamId}.`,
    //   life: 3000
    // });
  } else if (!newImageObject && currentDreamId) {
    // Handle case where image generation might have succeeded but saving to DB or association failed
    // Error toasts for this should ideally be handled within generateImageAndSave or saveGeneratedImage
    // This block might be redundant if errors are already toasted there.
    console.warn(
      '[TagCloud] Image generated but not returned for prepending, or not saved to dream.'
    )
  }
  // If newImageObject is null and currentDreamId was also null (new session, not auto-saved yet, though that logic is above now)
  // the 'Image Not Saved to Dream' toast is handled in the composable.
}

function handleNodePositionsUpdated(positions: { id: string; x: number; y: number }[]) {
  // Skip position updates during session restoration to prevent overriding loaded state
  if (tagStore.isRestoringSession) {
    return
  }

  // Only process valid positions
  const validPositions = positions.filter(
    (pos) =>
      pos &&
      typeof pos.id === 'string' &&
      typeof pos.x === 'number' &&
      typeof pos.y === 'number' &&
      !isNaN(pos.x) &&
      !isNaN(pos.y)
  )

  if (validPositions.length > 0) {
    // Prevent marking dirty state just from position updates
    // This avoids the "unsaved changes" warning when just moving nodes around
    const originalDirtyState = tagStore.hasUnsavedChanges

    validPositions.forEach((pos) => {
      const tag = tagStore.tags.find((t) => t.id === pos.id)
      if (tag) {
        // Only update position properties, preserving all other tag properties including transformation state
        tag.x = pos.x
        tag.y = pos.y
      }
    })

    // Restore original dirty state
    if (!originalDirtyState) {
      setTimeout(() => {
        tagStore.markAsSaved()
      }, 0)
    }
  }
}

function handleNodeTextUpdated({ id, text }: { id: string; text: string }) {
  if (isViewingSnapshot.value) {
    toast.add({
      severity: 'info',
      summary: 'Read-only',
      detail: 'Cannot edit tags while viewing a snapshot. Exit snapshot view first.',
      life: 3000,
    })
    return
  }
  if (tagStore.stashedSessionState) {
    tagStore.stashedSessionState = null // Clear stash
    tagStore.viewingSnapshotImageId = null // Clear viewing ID
  }
  tagStore.updateTagText(id, text)
  triggerPromptGeneration()
}

// Watch for changes in manual mode to populate the prompt
watch(isManualMode, (isManual) => {
  if (isManual) {
    manualPrompt.value = tagStore.currentGeneratedPrompt
  }
})

// New handler for the refresh button
function handleRefreshPrompt() {
  if (isViewingSnapshot.value) {
    toast.add({
      severity: 'info',
      summary: 'Read-only',
      detail: 'Cannot refresh prompt while viewing a snapshot. Exit snapshot view first.',
      life: 3000,
    })
    return
  }
  // Reset the prompt generation flag
  isGeneratingPrompt.value = false
  // Clear cached prompt for current tags to force fresh generation
  clearPromptCache(generatedPrompt.value)
  // Regenerate the prompt
  triggerPromptGeneration()
}

// New handler for downloading the image
async function handleDownloadImage() {
  // Generate filename based on current prompt or timestamp
  const promptText = isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt
  // Ensure tagStore.currentImageUrl is not null or undefined before calling
  if (tagStore.currentImageUrl) {
    await downloadImage(tagStore.currentImageUrl, promptText)
  } else {
    toast.add({
      severity: 'warn',
      summary: 'No Image',
      detail: 'No image available to download.',
      life: 3000,
    })
  }
}

// New handler for context menu concept selections
async function handleNodeContextMenu(payload: {
  category: string
  action: string
  nodeId: string
}) {

  if (isViewingSnapshot.value) {
    toast.add({
      severity: 'info',
      summary: 'Read-only',
      detail: 'Cannot modify graph while viewing a snapshot. Exit snapshot view first.',
      life: 3000,
    })
    return
  }

  if (tagStore.isRequestInProgress) {
    return
  }

  if (tagStore.stashedSessionState) {
    tagStore.stashedSessionState = null
    tagStore.viewingSnapshotImageId = null
  }

  try {
    console.log(`[CONTEXT_MENU] === STARTING TRANSFORMATION ===`)
    console.log(`[CONTEXT_MENU] nodeId: ${payload.nodeId}, action: ${payload.action}`)

    // Check current state before transformation
    const beforeTag = tagStore.tags.find((t) => t.id === payload.nodeId)
    if (beforeTag) {
      console.log(
        `[CONTEXT_MENU] BEFORE transformation: text="${beforeTag.text}", isTransformed=${beforeTag.isTransformed}`
      )
    }

    // Transform the node to the selected concept
    const transformResult = transformNodeConcept(
      payload.nodeId,
      payload.category,
      payload.action,
      tagStore.tags
    )
    tagStore.tags = transformResult.updatedTags
    tagStore.hasUnsavedChanges = true

    console.log(`[CONTEXT_MENU] Transformed node '${payload.nodeId}' to '${payload.action}'`)

    // Check current state after transformation
    const afterTag = tagStore.tags.find((t) => t.id === payload.nodeId)
    if (afterTag) {
      console.log(
        `[CONTEXT_MENU] AFTER transformation: text="${afterTag.text}", isTransformed=${afterTag.isTransformed}, originalText="${afterTag.originalText}"`
      )
    }

    await nextTick()
    if (forceGraphRef.value) {
      forceGraphRef.value.centerAndPinNodeById(transformResult.transformedTag.id)
    }

    // Generate new children for the transformed concept
    const result = await generateConceptTagsForTransformed(
      transformResult.transformedTag,
      tagStore.tags
    )
    tagStore.tags = result.updatedTags
    triggerPromptGeneration()

    console.log(
      `[TagCloud] Generated ${
        result.selectedTag.children?.length || 0
      } children for transformed concept '${payload.action}'`
    )
  } catch (error) {
    console.error('Error transforming node concept:', error)
    toast.add({
      severity: 'error',
      summary: 'Node Transformation Failed',
      detail: (error as Error).message || 'Could not transform node concept. Please try again.',
      life: 5000,
    })
  }
}

// Compute currently selected tags
const selectedTags = computed<TagType[]>(() => tagStore.tags.filter((t: TagType) => t.selected))

// Remove a tag and its dependent child tags
async function removeTag(tag: TagType) {
  if (isViewingSnapshot.value) {
    toast.add({
      severity: 'info',
      summary: 'Read-only',
      detail: 'Cannot remove tags while viewing a snapshot. Exit snapshot view first.',
      life: 3000,
    })
    return
  }
  // Toggle tag selection and wait for completion
  await tagStore.toggleTag(tag.id)
  // Recursively remove child tags that remain selected
  for (const child of tagStore.tags.filter((t: TagType) => t.selected && t.parentId === tag.id)) {
    await removeTag(child)
  }
  // Clear prompt cache for updated tags list
  clearPromptCache(generatedPrompt.value)
  // Trigger prompt regeneration for updated selection
  triggerPromptGeneration()
}

// New handler to apply snapshot state as current live session
async function handleApplySnapshot() {
  if (!isViewingSnapshot.value || !tagStore.stashedSessionState) {
    toast.add({
      severity: 'warn',
      summary: 'No Snapshot',
      detail: 'No snapshot is currently being viewed or no live session to overwrite.',
      life: 3000,
    })
    return
  }

  confirm.require({
    message:
      'This will replace your current live session with this snapshot. Your previous live session will be lost. Are you sure?',
    header: 'Apply Snapshot to Live Session',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Apply',
    rejectLabel: 'Cancel',
    rejectClass: 'p-button-secondary',
    accept: () => {
      // The current snapshot's state is already loaded. We just need to clear the stashed session.
      tagStore.stashedSessionState = null
      tagStore.viewingSnapshotImageId = null
      tagStore.hasUnsavedChanges = true // Mark as dirty since it's now the live session
      toast.add({
        severity: 'success',
        summary: 'Snapshot Applied',
        detail: 'The snapshot is now your live session.',
        life: 3000,
      })
      // Ensure the graph re-renders or updates if needed
      nextTick(() => {
        if (forceGraphRef.value) {
          const currentViewport = tagStore.getZoneViewport(tagStore.focusedZone)
          if (isValidViewport(currentViewport)) {
            forceGraphRef.value.applyViewport(currentViewport)
          } else {
            forceGraphRef.value.applyViewport() // Reset to default if invalid
          }
        }
      })
    },
    reject: () => {
      toast.add({
        severity: 'info',
        summary: 'Cancelled',
        detail: 'Snapshot application cancelled.',
        life: 3000,
      })
    },
  })
}

const currentViewMode = ref('graph')
// const viewModeOptions = ref([
//   { label: 'Graph', value: 'graph' },
//   // { label: 'Image Preview', value: 'image-preview' },
// ])

// Handle model selection change
function handleModelChange(modelId: string) {
  selectedModel.value = modelId
  console.log('Selected model changed to:', modelId)
}
</script>

<style scoped lang="scss">
.main-zone {
  // ... existing styles ...
}

.loading-session-indicator {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: calc(100vh - 100px); // Adjust height as needed, considering header/footer
  text-align: center;
  color: var(--text-color-secondary);

  p {
    margin-top: 1rem;
    font-size: 1.1rem;
  }
}

/* Component-specific styles are now in assets/scss/components/tag-cloud.scss */
/* We keep this block for scoped styles as needed but don't add any until explicitly asked */
.save-status {
  text-align: right;
}

.image-strip-wrapper {
  margin-top: 1rem; /* Or use grid gap, depending on desired spacing */
}

/* Spinning animation for refresh button */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Fade transitions for prompt text */
.prompt-text {
  transition: opacity 0.3s ease-in-out;
}

.fade-in {
  opacity: 1;
}

.fade-out {
  opacity: 0.5;
}

/* View mode toggle styling */
.view-mode-toggle {
  /* Ensure it's compact and fits well in the header */
}

/* Large image preview styles */
.large-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  flex-grow: 1;
}

.large-generated-image {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.large-placeholder-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
}

.image-preview-view {
  flex-grow: 1;
  min-height: 0;
}
</style>
