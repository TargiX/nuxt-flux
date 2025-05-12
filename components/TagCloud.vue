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

    
   <ImageStrip ref="imageStripRef" :dreamId="tagStore.loadedDreamId" @image-selected="handleImageSelectedFromStrip" />
     

    <div class="prompt-area-container glass-card">
      <div class="prompt-header flex justify-between items-start w-full">
          <h2>Generated Prompt:</h2>
          <ToggleButton 
            onLabel="Auto"
            class="px-1 py-1 h-8"
            offLabel="Manual"
            onIcon="pi pi-lock" 
            offIcon="pi pi-lock-open"
            v-model="isManualMode" 
          />
        </div>
      <div class="prompt-box w-full max-h-[100px] overflow-y-auto">
    
        
        <Textarea
          v-if="isManualMode"
          v-model="manualPrompt"
          class="manual-prompt-input text-[var(--text-color)] h-[calc(100%-10px)] w-full p-2"
          placeholder="Enter your prompt..."
        ></Textarea>
        <p class="text-white-palette" v-else>{{ tagStore.currentGeneratedPrompt }}</p>
        
     
      </div>
      <div class="flex justify-between items-center w-full mt-2"> 
        <p class="flex-grow !text-left text-xs selected-tags-display text-[#6d80a4]">
          Selected Tags: <span class="font-bold">{{ generatedPrompt }}</span>
        </p>
        <div class="flex gap-2">
          <Button 
            @click="handleSaveDreamClick"
            severity="secondary" 
            :disabled="isSavingDisabled"
            class="flex items-center gap-1 flex-nowrap whitespace-nowrap px-4 py-1" 
            icon="pi pi-save" 
            v-tooltip.top="'Save current state as Dream'" 
          >
             <ProgressSpinner
              v-if="isSavingDreamFromComposable"
              class="w-4 h-4 progress-spinner" 
              strokeWidth="8" 
              fill="transparent"
            />
            {{ isSavingDreamFromComposable ? 'Saving...'  : 'Save' }}
          </Button>
          <Button 
            @click="generateImage" 
            severity="primary"
            :disabled="isGenerationDisabled"
            class="flex items-center gap-2 flex-nowrap whitespace-nowrap pl-7 pr-8 py-1"
          >
            <ProgressSpinner
              v-if="isGeneratingImage"
              class="w-4 h-4 progress-spinner" 
              strokeWidth="8" 
              fill="transparent"
            />
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5Zm9-3a.75.75 0 0 1 .728.568l.258 1.036a2.63 2.63 0 0 0 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258a2.63 2.63 0 0 0-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.624 2.624 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5ZM16.5 15a.75.75 0 0 1 .712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 0 1 0 1.422l-1.183.395a1.5 1.5 0 0 0-.948.948l-.395 1.183a.75.75 0 0 1-1.422 0l-.395-1.183a1.5 1.5 0 0 0-.948-.948l-1.183-.395a.75.75 0 0 1 0-1.422l1.183-.395a1.5 1.5 0 0 0 .948-.948l.395-1.183a.75.75 0 0 1 .71-.513Z" fill="currentColor"></path></svg>
            {{ isGeneratingImage ? 'Generating...' : (isImageCooldown ? 'Cooldown...' : 'Generate Image') }}
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
import { generateImageFromPrompt } from '~/services/imageGenerationService';
import { saveGeneratedImage } from '~/services/imageService';
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
const isGeneratingImage = ref(false)
const isImageCooldown = ref(false)
const isGeneratingPrompt = ref(false);

let promptRequestId = 0
let imageRequestId = 0

const isGenerationDisabled = computed(() => {
  return !(isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt) || isGeneratingImage.value || isSavingDreamFromComposable.value || isImageCooldown.value
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
  // Ignore clicks if we're already processing a request
  if (tagStore.isRequestInProgress) {
    console.log('Ignoring node click - request already in progress');
    return;
  }
  
  // Cancel any running prompt generation by incrementing the request ID
  promptRequestId++;
  
  console.log('TagCloud received nodeClick:', id);
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
  isGeneratingImage.value = false;

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

const generateImage = async () => {
  const promptText = isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt;
  
  if (!promptText || isGeneratingImage.value || isImageCooldown.value) {
    if (!promptText) {
      console.error('No prompt text available for image generation.');
      toast.add({
        severity: 'warn',
        summary: 'Missing Prompt',
        detail: 'Cannot generate image without a prompt text.',
        life: 3000,
      });
    }
    return;
  }

  isGeneratingImage.value = true;
  tagStore.setCurrentImageUrl(null);
  const currentImageRequestId = ++imageRequestId;
  try {
    const imageUrl = await generateImageFromPrompt(promptText);
    if (currentImageRequestId === imageRequestId) {
      tagStore.setCurrentImageUrl(imageUrl);

      if (tagStore.loadedDreamId && imageUrl) {
        try {
          // Construct the graphState snapshot
          const currentGraphState = {
            focusedZone: focusedZone.value,
            tags: JSON.parse(JSON.stringify(tagStore.tags)), // Deep clone of tags
            // currentGeneratedPrompt: tagStore.currentGeneratedPrompt, // The promptText is already passed separately
            // currentImageUrl: imageUrl, // The imageUrl is already passed separately
            // Include other relevant state if needed, e.g., viewport, zoom, specific settings
            // For now, keeping it to focusedZone and tags.
            // Consider also saving the viewport state of the graph at this point:
            // graphViewport: forceGraphRef.value?.getCurrentViewport ? forceGraphRef.value.getCurrentViewport() : null
          };

          await saveGeneratedImage({
            imageUrl,
            promptText,
            dreamId: tagStore.loadedDreamId,
            graphState: currentGraphState, // Pass the captured graph state
          });
          toast.add({
            severity: 'info',
            summary: 'Image Saved',
            detail: 'Generated image progress saved to your dream history.',
            life: 3000,
          });
          // Refetch images in the strip
          if (imageStripRef.value) {
            imageStripRef.value.refetchImages();
          }
        } catch (saveError: any) {
          console.error('Failed to save generated image to DB:', saveError);
          toast.add({
            severity: 'error',
            summary: 'Image Save Failed',
            detail: saveError.message || 'Could not save image progress to dream history.',
            life: 5000,
          });
        }
      } else if (!tagStore.loadedDreamId && imageUrl) {
        toast.add({
          severity: 'warn',
          summary: 'Image Not Saved to Dream',
          detail: 'Save your current session as a Dream to keep this image in its history.',
          life: 5000,
        });
      }
    }
  } catch (error: any) {
    console.error('Failed to generate image:', error);
    if (currentImageRequestId === imageRequestId) {
      tagStore.setCurrentImageUrl(null);
      toast.add({
        severity: 'error',
        summary: 'Image Generation Failed',
        detail: error.message || 'Could not generate image. Please try again.',
        life: 5000,
      });
    }
  } finally {
    if (currentImageRequestId === imageRequestId) {
      isGeneratingImage.value = false;
      isImageCooldown.value = true;
      setTimeout(() => {
        isImageCooldown.value = false;
      }, 1500);
    }
  }
};

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
  console.log('[TagCloud] Received nodeTextUpdated:', { id, text });
  tagStore.updateTagText(id, text);
  triggerPromptGeneration(); // Explicitly trigger prompt generation after text update
}

// New handler for the save button
async function handleSaveDreamClick() {
  if (isSavingDisabled.value) return;

  const plainTags = JSON.parse(JSON.stringify(tagStore.tags));
  const dreamDataPayload = {
    focusedZone: focusedZone.value,
    tags: plainTags,
    generatedPrompt: tagStore.currentGeneratedPrompt,
    imageUrl: tagStore.currentImageUrl,
    zoneViewports: tagStore.getAllZoneViewportsObject()
  };

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
  console.log('Image selected from strip in TagCloud:', image);
  if (image && image.imageUrl) {
    tagStore.setCurrentImageUrl(image.imageUrl);
    
    // Immediately signal that the next prompt generation (if any) due to state load should be skipped
    // skipPrompt.value = true;

    if (image.graphState) {
      console.log('Loading graph state from selected image:', image.graphState);
      tagStore.loadStateFromImageSnapshot(image); // Pass the whole image object
      
      // Update manual prompt if in manual mode and promptText exists for the image
      if (isManualMode.value && image.promptText) {
        manualPrompt.value = image.promptText;
      } else if (!isManualMode.value && image.promptText) {
        // If not in manual mode, also update the store's currentGeneratedPrompt
        // Set skipUndo to true if loadStateFromImageSnapshot doesn't handle prompt setting
        tagStore.setCurrentGeneratedPrompt(image.promptText, true);
      }

      // After loading a snapshot, we might want to prevent immediate prompt regeneration
      // if the loaded tags would trigger it.
      // skipPrompt.value = true;
      nextTick(() => {
        // Force graph to re-render with potentially new node positions from loaded state
        if (forceGraphRef.value) {
          // forceGraphRef.value.updateGraph(); 
          // Consider if a full viewport reset/centering is needed or if loaded state includes viewport
          // forceGraphRef.value.resetAndCenter(); 
        }
      });

    } else if (image.promptText) { // Fallback if no graphState, but there is a prompt
        // skipPrompt.value = true;
        if (isManualMode.value) {
            manualPrompt.value = image.promptText;
        } else {
            tagStore.setCurrentGeneratedPrompt(image.promptText, true);
        }
    }
  }
};

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
</style>