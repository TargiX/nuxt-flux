<template>
   <div class="main-zone grid grid-cols-2 tw-gap-4">
    
    <!-- Top Left: Graph -->
    <div class="graph-container glass-card">
      <h2 class="zone-title">{{ focusedZone }}</h2>
      <ForceGraph
        ref="forceGraphRef"
        :width="800"
        :height="600"
        :nodes="graphNodes"
        :links="graphLinks"
        @nodeClick="handleNodeClick"
        @nodePositionsUpdated="handleNodePositionsUpdated"
        @nodeTextUpdated="handleNodeTextUpdated"
      >
        <!-- Zone selector will be moved here via slot later -->
        <template #controls>
          <div class="zone-selector-container mt-4">
            <ZoneSelector
              v-model:modelValue="selectedZone"
              :options="zoneOptions"
            />
          </div>
        </template>
      </ForceGraph>
    </div>

    <!-- Top Right: Image Preview -->
    <div class="image-preview-container glass-card">
      <h2>Image:</h2>
      <div class="image-container">
        <img
          v-if="tagStore.currentImageUrl"
          :src="tagStore.currentImageUrl"
          alt="Generated Image"
          class="generated-image"
        />
        <div v-else class="placeholder-container"></div>
      </div>
            <!-- Image Strip moved here -->
   
    </div>

    
   <ImageStrip 
      ref="imageStripRef" 
      :dreamId="tagStore.loadedDreamId" 
      @image-selected="handleImageSelectedFromStrip" 
      :viewingSnapshotId="tagStore.viewingSnapshotImageId"
    />
     

    <div class="prompt-area-container glass-card">
      <div class="prompt-header flex justify-between items-start w-full">
          <h2>Generated Prompt:</h2>
          <div class="flex items-center gap-2">
            <Button 
              v-if="tagStore.stashedSessionState"
              label="Exit Snapshot View"
              icon="pi pi-replay"
              severity="info"
              text
              size="small"
              class="px-2 py-1 h-8"
              @click="tagStore.restoreStashedSession()"
              v-tooltip.top="'Return to your live session'"
            />
            <Button 
              v-if="!isManualMode && generatedPrompt"
              icon="pi pi-refresh"
              severity="secondary"
              text
              size="small"
              class="w-7 h-7 !p-0 flex items-center justify-center"
              :class="{ 'animate-spin': isGeneratingPrompt }"
              @click="handleRefreshPrompt"
              :disabled="isGeneratingPrompt"
              v-tooltip.top="'Regenerate prompt'"
            />
            <ToggleButton 
              onLabel="Auto"
              class="px-1 py-1 h-8"
              offLabel="Manual"
              onIcon="pi pi-lock" 
              offIcon="pi pi-lock-open"
              v-model="isManualMode" 
            />
          </div>
        </div>
      <div class="prompt-box w-full max-h-[100px] overflow-y-auto">
    
        
        <Textarea
          v-if="isManualMode"
          v-model="manualPrompt"
          class="manual-prompt-input text-[var(--text-color-secondary)] h-[calc(100%-10px)] w-full p-2"
          placeholder="Enter your prompt..."
        ></Textarea>
        <p 
          class="text-white-palette prompt-text" 
          :class="{ 'fade-in': !isGeneratingPrompt, 'fade-out': isGeneratingPrompt }"
          v-else
        >
          {{ tagStore.currentGeneratedPrompt }}
        </p>
        
     
      </div>
      <div class="flex justify-between items-center w-full mt-2"> 
        <p class="flex-grow !text-left text-xs selected-tags-display text-[#6d80a4]">
          Selected Tags: <span class="font-bold">{{ generatedPrompt }}</span>
        </p>
        <div class="flex gap-2">
          <Button 
            @click="handleSaveDreamClick"
            severity="info"
            :disabled="isSavingDisabled"
            class="flex items-center justify-center w-8 h-8 !p-0 !bg-blue-600 hover:!bg-blue-700 !border-blue-600 hover:!border-blue-700" 
            v-tooltip.top="'Save session'" 
          >
             <!-- Custom floppy disk icon -->
             <svg 
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
               <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l3 3v13a2 2 0 0 1-2 2z"/>
               <polyline points="17,21 17,13 7,13 7,21"/>
               <polyline points="7,3 7,8 15,8"/>
             </svg>
             <ProgressSpinner
               v-if="isSavingDreamFromComposable"
               class="w-3 h-3 progress-spinner" 
               strokeWidth="8" 
               fill="transparent"
             />
          </Button>
          <Button 
            @click="handleGenerateImageClick" 
            severity="primary"
            :disabled="isGenerationDisabled"
            class="flex items-center gap-2 flex-nowrap whitespace-nowrap pl-7 pr-8 py-1"
          >
            <ProgressSpinner
              v-if="isGeneratingImageFromComposable"
              class="w-4 h-4 progress-spinner" 
              strokeWidth="8" 
              fill="transparent"
            />
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Zm9-3a.75.75 0 0 1 .728.568l.258 1.036a2.63 2.63 0 0 0 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a2.63 2.63 0 0 0-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.624 2.624 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395a1.5 1.5 0 0 0-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395a1.5 1.5 0 0 0 .948-.948l.395-1.183a.75.75 0 0 1 .71-.513Z" fill="currentColor"></path></svg>
            {{ isGeneratingImageFromComposable ? 'Generating...' : (isImageCooldownFromComposable ? 'Cooldown...' : 'Generate Image') }}
          </Button>
        </div>
      </div>
    </div>


  
    <!-- Bottom Right: Prompt Area -->
    

    <!-- Full-width Image Strip below the top two sections -->
 

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { useTagStore } from '~/store/tagStore';
import ForceGraph from './ForceGraph.vue';
import ZoneSelector from './ZoneSelector.vue';
import ImageStrip from './ImageStrip.vue';
import { generateImagePrompt } from '~/services/promptGenerationService';
import { useImageGeneration } from '~/composables/useImageGeneration';
import type { Tag } from '~/types/tag';
import type { ViewportState } from '~/composables/useZoom';
import { useDreamManagement } from '~/composables/useDreamManagement';

const tagStore = useTagStore();
const toast = useToast();

// Use the dream management composable
const { 
  isSavingDream: isSavingDreamFromComposable, 
  initiateSaveDreamProcess
} = useDreamManagement();

// Use the image generation composable
const { 
  isGeneratingImage: isGeneratingImageFromComposable, 
  isImageCooldown: isImageCooldownFromComposable,
  generateImageAndSave
} = useImageGeneration();

const forceGraphRef = ref<InstanceType<typeof ForceGraph> | null>(null);
const imageStripRef = ref<InstanceType<typeof ImageStrip> | null>(null);

const focusedZone = computed(() => tagStore.focusedZone);
const zoneOptions = ref([...tagStore.zones]);
const graphNodes = computed(() => tagStore.graphNodes);
const graphLinks = computed(() => tagStore.graphLinks);

const selectedZone = ref(focusedZone.value);

// First let's add a zone change tracking flag
const isZoneSwitching = ref(false);

watch(() => tagStore.loadedDreamId, (newId, oldId) => {
  if (newId !== oldId) {
    // skipPrompt.value = true;
  }
});

const isManualMode = ref(false)
const manualPrompt = ref('')
// const isGeneratingImage = ref(false) // REMOVED - Use from composable
// const isImageCooldown = ref(false) // REMOVED - Use from composable
const isGeneratingPrompt = ref(false);

let promptRequestId = 0
// let imageRequestId = 0 // REMOVED - Managed by composable

const isGenerationDisabled = computed(() => {
  // Use states from image generation composable
  return !(isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt) || 
         isGeneratingImageFromComposable.value || 
         isSavingDreamFromComposable.value || 
         isImageCooldownFromComposable.value;
})

const isSavingDisabled = computed(() => {
  // Disabled if currently saving, or if no tags are selected (for new dream), 
  // or if there are no unsaved changes (for existing or new).
  return isSavingDreamFromComposable.value || 
         (tagStore.tags.filter(t => t.selected).length === 0 && tagStore.loadedDreamId === null) || 
         !tagStore.hasUnsavedChanges;
})

const generatedPrompt = computed(() => {
  const allSelectedTags = tagStore.tags
    .filter(tag => tag.selected) 
    .map(tag => tag.text)
    .sort();
  return allSelectedTags.join(', ');
})

watch(() => tagStore.zones, () => {
  zoneOptions.value = [...tagStore.zones];
}, { deep: true });

watch(focusedZone, (newZone) => {
  selectedZone.value = newZone;
});

// Check the zone watcher to add the zone switching protection
watch(selectedZone, (newZone, oldZone) => {
  if (newZone && newZone !== oldZone) {
    // Set flag to prevent prompt generation during zone switch
    isZoneSwitching.value = true;
    switchToZone(newZone, oldZone || tagStore.focusedZone);
    // Reset the flag after a delay to allow zone switch to complete
    setTimeout(() => {
      isZoneSwitching.value = false;
    }, 500);
  }
});

function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const context = this;
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func.apply(context, args);
      timeout = null;
    }, wait);
  };
}

// Update the triggerPromptGeneration function to check for zone switching
const triggerPromptGeneration = debounce(async () => {
  // Skip prompt generation if we're in manual mode, already generating,
  // or during zone switching
  if (isManualMode.value || isGeneratingPrompt.value || isZoneSwitching.value) {
    return;
  }
  
  const tagsString = generatedPrompt.value;
  if (tagsString.length > 0) {
    isGeneratingPrompt.value = true;
    const currentRequestId = ++promptRequestId;
    try {
      const result = await generateImagePrompt(tagsString);
      // Check again if zone has changed during generation
      if (currentRequestId === promptRequestId && !isZoneSwitching.value) {
        tagStore.setCurrentGeneratedPrompt(result, false);
      }
    } catch (error: any) {
      console.error('Failed to generate prompt:', error);
      if (currentRequestId === promptRequestId && !isZoneSwitching.value) {
        tagStore.setCurrentGeneratedPrompt('Error generating prompt.', false);
        toast.add({
          severity: 'error',
          summary: 'Prompt Generation Failed',
          detail: error.message || 'Could not generate prompt. Please try again.',
          life: 5000,
        });
      }
    } finally {
      if (currentRequestId === promptRequestId) {
        isGeneratingPrompt.value = false;
      }
    }
  } else {
    tagStore.setCurrentGeneratedPrompt('');
  }
}, 300);

// Skip generation once after load, then resume normal behavior
watch(generatedPrompt, () => {
  // if (skipPrompt.value) {
    // skipPrompt.value = false;
    // return;
  // }
  // triggerPromptGeneration();
});

onMounted(() => {
  // triggerPromptGeneration();
});

// Update the handleNodeClick function to be aware of session state
async function handleNodeClick(id: string) {
  if (tagStore.isRequestInProgress) {
    return;
  }

  if (tagStore.stashedSessionState) {
    console.log("[TagCloud] Interaction while viewing snapshot. Clearing stashed session.");
    tagStore.stashedSessionState = null; // Clear stash
    tagStore.viewingSnapshotImageId = null; // Clear viewing ID
    // The current state is now the live session
  }

  promptRequestId++;
  try {
    await tagStore.toggleTag(id);
    // Explicitly trigger prompt generation after tags have been updated
    triggerPromptGeneration(); 
  } catch (error: any) {
    console.error('Error toggling tag or generating related tags:', error);
    toast.add({
      severity: 'error',
      summary: 'Tag Action Failed',
      detail: error.message || 'Could not toggle tag or generate related tags. Please try again.',
      life: 5000,
    });
  }
}

// Modify the loadedDreamId watcher to use synchronous reset
watch(() => tagStore.loadedDreamId, (newId, oldId) => {
  // Reset all prompt-related state when loading a new dream or clearing to new session
  promptRequestId++; // Cancel any pending prompt operations
  // skipPrompt.value = true;
  
  // Reset cooldowns and generation states
  isGeneratingPrompt.value = false;
  // isGeneratingImage.value = false; // Now handled by composable

  if (tagStore.stashedSessionState) {
    console.log("[TagCloud] New dream loaded/session changed. Clearing any stashed session.");
    // No need to restore, just clear. The new dream/session takes precedence.
    tagStore.stashedSessionState = null;
    tagStore.viewingSnapshotImageId = null;
  }

  // Directly reset viewport for new sessions - no timeouts
  if (newId === null && forceGraphRef.value) {
    console.log('New session detected - performing immediate viewport reset');
    forceViewportReset();
  }
  
  // Use a single timeout for optional regeneration later
  // skipPrompt.value = true;
  // setTimeout(() => {
    // skipPrompt.value = false;
  // }, 1000);
  // Reset the flag in the next tick after potential state changes have settled
  // nextTick(() => {
    // skipPrompt.value = false;
  // });
});

// Remove the problematic timeout-based forceViewportReset function
function forceViewportReset() {
  if (!forceGraphRef.value) return;
  
  console.log('Forcing complete viewport reset with default zoom level');
  
  // Always use resetAndCenter which applies the proper default zoom
  forceGraphRef.value.resetAndCenter();
}

// Fix switchToZone to properly handle default viewport
async function switchToZone(newZone: string, oldZone?: string) {
  // Cancel any running prompt generation by incrementing the request ID
  promptRequestId++;
  
  // Skip prompt generation during zone switch
  isZoneSwitching.value = true;
  
  const currentOldZone = oldZone || tagStore.focusedZone;

  // Save viewport of the zone we're leaving
  if (forceGraphRef.value && currentOldZone) {
    const currentViewport = forceGraphRef.value.getCurrentViewport();
    if (currentViewport) {
      tagStore.saveZoneViewport(currentOldZone, currentViewport);
      console.log(`Saved viewport for ${currentOldZone}:`, currentViewport);
    }
  }

  console.log(`Switching from ${currentOldZone} to ${newZone}`);
  tagStore.setFocusedZone(newZone);

  // Wait for the zone change to be processed
  await nextTick();

  // Apply the viewport for the new zone, if available
  if (forceGraphRef.value) {
    try {
      const savedViewport = tagStore.getZoneViewport(newZone);
      if (savedViewport) {
        console.log(`Applying saved viewport for ${newZone}:`, savedViewport);
        // Validate the saved viewport
        if (isValidViewport(savedViewport)) {
          forceGraphRef.value.applyViewport(savedViewport);
        } else {
          console.warn(`Invalid viewport for ${newZone}, applying default`);
          forceGraphRef.value.applyViewport();
        }
      } else {
        console.log(`No saved viewport for ${newZone}, applying default.`);
        forceGraphRef.value.applyViewport();
      }
    } catch (err) {
      console.error('Error applying viewport:', err);
      // Fallback to default viewport on error
      forceGraphRef.value.applyViewport();
    }
  }
  
  // Re-enable prompt generation - no timeout
  isZoneSwitching.value = false;
}

// Add a function to validate viewport states
function isValidViewport(viewport: ViewportState): boolean {
  // Check for NaN or invalid values
  if (viewport === null || viewport === undefined) return false;
  
  const { x, y, k } = viewport;
  
  // Check if properties exist and are valid numbers
  if (typeof x !== 'number' || typeof y !== 'number' || typeof k !== 'number') {
    return false;
  }
  
  // Check for NaN, infinity, or zero scale which would break viewport
  if (isNaN(x) || isNaN(y) || isNaN(k) || !isFinite(x) || !isFinite(y) || !isFinite(k) || k <= 0) {
    return false;
  }
  
  return true;
}

// Helper function to construct dream data payload
function getDreamDataPayload() {
  const plainTags = JSON.parse(JSON.stringify(tagStore.tags));
  return {
    focusedZone: focusedZone.value,
    tags: plainTags,
    generatedPrompt: tagStore.currentGeneratedPrompt,
    imageUrl: tagStore.currentImageUrl,
    zoneViewports: tagStore.getAllZoneViewportsObject()
  };
}

// New handler for the save button
async function handleSaveDreamClick() {
  if (isSavingDisabled.value) return;

  const dreamDataPayload = getDreamDataPayload();
  await initiateSaveDreamProcess(dreamDataPayload);
}

// Update manual prompt values when loading dreams
watch(() => tagStore.currentGeneratedPrompt, (newPrompt) => {
  if (newPrompt && isManualMode.value) {
    manualPrompt.value = newPrompt;
  }
});

// Watch for store session changes to reset local flags
watch(() => tagStore.sessionId, () => {
  // Reset any local state when the store's session changes
  promptRequestId++;
  isZoneSwitching.value = false;
  
  // Simple synchronous operation - don't use timeouts that cause race conditions
  // skipPrompt.value = false;
});

// Placeholder for handling image selection from the strip
const handleImageSelectedFromStrip = (image: any) => {
  if (image && image.imageUrl) {
    // If we're not already viewing a snapshot, stash the current session.
    // If we are, the original session is already stashed.
    if (!tagStore.stashedSessionState) {
      tagStore.stashCurrentSession();
    }
    
    // It's important to set the image URL *before* loading the snapshot state,
    // as loadStateFromImageSnapshot might also set currentImageUrl.
    // However, the snapshot is the source of truth for the image being viewed.
    // tagStore.setCurrentImageUrl(image.imageUrl); // This will be handled by loadStateFromImageSnapshot

    tagStore.loadStateFromImageSnapshot(image); 
    tagStore.viewingSnapshotImageId = image.id; // Update store state

    // The rest of the logic for updating manualPrompt etc. from image.promptText
    // should ideally be inside loadStateFromImageSnapshot or triggered by it if needed.
    if (isManualMode.value && image.promptText) {
      manualPrompt.value = image.promptText;
    } else if (!isManualMode.value && image.promptText) {
      // loadStateFromImageSnapshot already sets currentGeneratedPrompt
      // tagStore.setCurrentGeneratedPrompt(image.promptText, true);
    }
    // nextTick for graph updates can remain if still necessary after store changes
    nextTick(() => {
      if (forceGraphRef.value) { /* Potentially update graph if needed */ }
    });

  } else if (tagStore.viewingSnapshotImageId === image?.id) {
    // If the *currently selected* snapshot image is clicked again, restore session.
    // This provides a way to exit snapshot view by clicking the selected image again.
    if (tagStore.stashedSessionState) {
      tagStore.restoreStashedSession();
    }
  }
};

// New handler for the Generate Image button
async function handleGenerateImageClick() {
  const promptText = isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt;
  
  if (!promptText || 
      isGeneratingImageFromComposable.value || 
      isImageCooldownFromComposable.value || 
      isSavingDreamFromComposable.value) {
    return;
  }

  if (tagStore.stashedSessionState) {
    console.log("[TagCloud] Generating image while viewing snapshot. Clearing stashed session.");
    tagStore.stashedSessionState = null;
    tagStore.viewingSnapshotImageId = null;
  }

  let currentDreamId = tagStore.loadedDreamId;

  if (currentDreamId === null) {
    console.log("[TagCloud] New session, auto-saving before image generation.");
    // toast.add({ severity: 'info', summary: 'Saving Session', detail: 'Auto-saving current session...', life: 3000 });

    const dreamDataPayload = getDreamDataPayload();

    try {
      await initiateSaveDreamProcess(dreamDataPayload); 
      
      if (tagStore.loadedDreamId === null) {
        console.error("[TagCloud] Auto-save initiated but dream ID is still null in store. Aborting image generation.");
        toast.add({ severity: 'error', summary: 'Save Failed', detail: 'Failed to auto-save session. Image generation aborted.', life: 5000 });
        return; 
      }
      currentDreamId = tagStore.loadedDreamId;
      // toast.add({ severity: 'success', summary: 'Session Saved', detail: `Session auto-saved successfully. Dream ID: ${currentDreamId}`, life: 3000 });
    } catch (error: any) {
      console.error('Failed to auto-save dream:', error);
      toast.add({
        severity: 'error',
        summary: 'Auto-Save Failed',
        detail: error.message || 'Could not auto-save session. Image generation aborted.',
        life: 5000,
      });
      return;
    }
  }

  if (currentDreamId === null) {
      console.error("[TagCloud] Dream ID is critically null before generating image. Aborting.");
      toast.add({ severity: 'error', summary: 'Internal Error', detail: 'Dream ID is missing. Cannot generate image.', life: 5000 });
      return;
  }
  
  const newImageObject = await generateImageAndSave(
    promptText,
    currentDreamId,
    focusedZone.value,
    tagStore.tags
  );

  if (newImageObject && imageStripRef.value) {
    // Instead of refetching, prepend the new image
    imageStripRef.value.prependImage(newImageObject);
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
    console.warn('[TagCloud] Image generated but not returned for prepending, or not saved to dream.');
  }
  // If newImageObject is null and currentDreamId was also null (new session, not auto-saved yet, though that logic is above now)
  // the 'Image Not Saved to Dream' toast is handled in the composable.
}

function handleNodePositionsUpdated(positions: { id: string; x: number; y: number }[]) {
  // Only process valid positions
  const validPositions = positions.filter(pos => 
    pos && typeof pos.id === 'string' && 
    typeof pos.x === 'number' && 
    typeof pos.y === 'number' && 
    !isNaN(pos.x) && !isNaN(pos.y)
  );
  
  if (validPositions.length > 0) {
    // Prevent marking dirty state just from position updates
    // This avoids the "unsaved changes" warning when just moving nodes around
    const originalDirtyState = tagStore.hasUnsavedChanges;
    
    validPositions.forEach(pos => {
      const tag = tagStore.tags.find(t => t.id === pos.id);
      if (tag) {
        tag.x = pos.x;
        tag.y = pos.y;
      }
    });
    
    // Restore original dirty state
    if (!originalDirtyState) {
      setTimeout(() => {
        tagStore.markAsSaved();
      }, 0);
    }
  }
}

function handleNodeTextUpdated({ id, text }: { id: string; text: string }) {
  if (tagStore.stashedSessionState) {
    console.log("[TagCloud] Node text updated while viewing snapshot. Clearing stashed session.");
    tagStore.stashedSessionState = null; // Clear stash
    tagStore.viewingSnapshotImageId = null; // Clear viewing ID
  }
  tagStore.updateTagText(id, text);
  triggerPromptGeneration(); 
}

// Watch for changes in manual mode to populate the prompt
watch(isManualMode, (isManual) => {
  if (isManual) {
    manualPrompt.value = tagStore.currentGeneratedPrompt;
  }
});

// New handler for the refresh button
function handleRefreshPrompt() {
  // Reset the prompt generation flag
  isGeneratingPrompt.value = false;
  // Regenerate the prompt
  triggerPromptGeneration();
}

</script>

<style scoped>
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
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
</style>