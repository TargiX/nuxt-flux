<template>
   <div class="main-zone grid grid-cols-2 tw-gap-4">
    
    <!-- Top Left: Graph -->
    <div class="graph-container glass-card">
      <h2 class="zone-title">{{ focusedZone }}</h2>
      <ForceGraph
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
    </div>

    <!-- Bottom Left: Settings Placeholder -->
    <div class="settings-container glass-card">
      <h2>Settings</h2>
      <!-- Settings content will go here -->
      <p>Settings placeholder...</p>
    </div>

    <!-- Bottom Right: Prompt Area -->
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
      <div class="prompt-box w-full">
    
        
        <Textarea
          v-if="isManualMode"
          v-model="manualPrompt"
          class="manual-prompt-input text-[var(--text-color)] h-[calc(100%-10px)] w-full p-2"
          placeholder="Enter your prompt..."
        ></Textarea>
        <p class="text-[#474565]" v-else>{{ tagStore.currentGeneratedPrompt }}</p>
        
     
      </div>
      <div class="flex justify-between items-center w-full mt-2"> 
        <p class="flex-grow !text-left text-xs selected-tags-display text-[#6d80a4]">
          Selected Tags: <span class="font-bold">{{ generatedPrompt }}</span>
        </p>
        <div class="flex gap-2">
          <Button 
            @click="saveDream"
            severity="secondary" 
            :disabled="isSavingDream || tagStore.tags.filter(t => t.selected).length === 0"
            class="flex items-center gap-1 flex-nowrap whitespace-nowrap px-4 py-1" 
            icon="pi pi-save" 
            v-tooltip.top="'Save current state as Dream'" 
          >
             <ProgressSpinner
              v-if="isSavingDream"
              class="w-4 h-4 progress-spinner" 
              strokeWidth="8" 
              fill="transparent"
            />
            {{ isSavingDream ? 'Saving...' : 'Save' }}
          </Button>
          <Button 
            @click="generateImage" 
            severity="primary"
            :disabled="!(isManualMode ? manualPrompt : tagStore.currentGeneratedPrompt) || isGeneratingImage || isSavingDream"
            class="flex items-center gap-2 flex-nowrap whitespace-nowrap px-8 py-1"
          >
            <ProgressSpinner
              v-if="isGeneratingImage"
              class="w-4 h-4 progress-spinner" 
              strokeWidth="8" 
              fill="transparent"
            />
            {{ isGeneratingImage ? 'Generating...' : 'Generate Image' }}
          </Button>
        </div>
      </div>
      <div v-if="saveStatus" class="save-status text-xs mt-1" :class="{ 'text-green-400': saveStatus === 'Saved!', 'text-red-400': saveStatus.startsWith('Error') }">{{ saveStatus }}</div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useTagStore } from '~/store/tagStore';
import ForceGraph from './ForceGraph.vue';
import ZoneSelector from './ZoneSelector.vue';
import { generateImagePrompt } from '~/services/promptGenerationService';
import { generateImageFromPrompt } from '~/services/imageGenerationService';
// Import useToast if using PrimeVue Toast service
// import { useToast } from "primevue/usetoast";
import type { Tag } from '~/types/tag'; // Import the Tag type

const tagStore = useTagStore();

// --- Define Emits ---
// const emit = defineEmits<{ (e: 'dreamSaved'): void }>(); // Removed
// --------------------

const focusedZone = computed(() => tagStore.focusedZone);
const zoneOptions = ref([...tagStore.zones]);
const graphNodes = computed(() => tagStore.graphNodes);
const graphLinks = computed(() => tagStore.graphLinks);

const selectedZone = ref(focusedZone.value);

// Add state for saving process
const isSavingDream = ref(false);
const saveStatus = ref<string | null>(null); // To show save success/error
// const toast = useToast(); // Uncomment if using PrimeVue Toast

watch(selectedZone, (newZone) => {
  if (newZone) {
    switchToZone(newZone);
  }
});

const isManualMode = ref(false)
const manualPrompt = ref('')
const isGeneratingImage = ref(false)
const isGeneratingPrompt = ref(false);

let promptRequestId = 0
let imageRequestId = 0

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

const triggerPromptGeneration = debounce(async () => {
  if (isManualMode.value || isGeneratingPrompt.value) return;
  
  const tagsString = generatedPrompt.value;
  if (tagsString.length > 0) {
    isGeneratingPrompt.value = true;
    const currentRequestId = ++promptRequestId;
    try {
      const result = await generateImagePrompt(tagsString);
      if (currentRequestId === promptRequestId) {
        tagStore.setCurrentGeneratedPrompt(result);
      }
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      if (currentRequestId === promptRequestId) {
        tagStore.setCurrentGeneratedPrompt('Error generating prompt.');
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

watch(generatedPrompt, () => {
  triggerPromptGeneration();
});

onMounted(() => {
  triggerPromptGeneration();
});

function handleNodeClick(id: string) {
  console.log('TagCloud received nodeClick:', id);
  tagStore.toggleTag(id);
}

function switchToZone(zone: string) {
  console.log(`Switching to ${zone}`);
  tagStore.setFocusedZone(zone);
}

const generateImage = async () => {
  const promptText = isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt;
  
  if (!promptText) {
    console.error('No prompt text available for image generation.');
    return;
  }

  isGeneratingImage.value = true;
  tagStore.setCurrentImageUrl(null);
  const currentImageRequestId = ++imageRequestId;

  try {
    const generatedImageUrl = await generateImageFromPrompt(promptText);
    
    if (currentImageRequestId === imageRequestId) {
      tagStore.setCurrentImageUrl(generatedImageUrl);
      if (!generatedImageUrl) {
        console.error('Image generation service returned null.');
      }
    }
  } catch (error) {
    console.error('Error generating image:', error);
    if (currentImageRequestId === imageRequestId) {
      tagStore.setCurrentImageUrl(null);
    }
  } finally {
    if (currentImageRequestId === imageRequestId) {
      isGeneratingImage.value = false;
    }
  }
}

function handleNodePositionsUpdated(positions: { id: string; x: number; y: number }[]) {
  console.log('Received updated positions:', positions);
  positions.forEach(pos => {
    const tag = tagStore.tags.find(t => t.id === pos.id);
    if (tag) {
      tag.x = pos.x;
      tag.y = pos.y;
    }
  });
}

function handleNodeTextUpdated({ id, text }: { id: string; text: string }) {
  console.log('[TagCloud] Received nodeTextUpdated:', { id, text });
  tagStore.updateTagText(id, text);
  triggerPromptGeneration();
}

// --- Updated Save Dream Logic ---
async function saveDream() {
  if (isSavingDream.value) return;
  
  isSavingDream.value = true;
  saveStatus.value = null; // Clear previous status

  // Prepare the data payload
  // Using structuredClone for a deep copy, but handle tags separately
  const plainTags = JSON.parse(JSON.stringify(tagStore.tags)); // Convert reactive tags to plain objects
  const dreamData = structuredClone({
    focusedZone: focusedZone.value,
    tags: plainTags, // Use the plain version of tags
    generatedPrompt: tagStore.currentGeneratedPrompt, // Save the AI-generated prompt
    imageUrl: tagStore.currentImageUrl // Optionally save the image URL
    // Add any other relevant state here
  });

  // Optional: Create a simple title based on selected tags
  const title = dreamData.tags
    .filter((t: Tag) => t.selected) // Add type : Tag
    .slice(0, 3) // Take first 3 selected tags for title
    .map((t: Tag) => t.text) // Add type : Tag
    .join(', ') || 'Untitled Dream';

  try {
    const response = await fetch('/api/dreams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: title, data: dreamData }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to save dream (${response.status}): ${errorData}`);
    }

    const savedDream = await response.json();
    console.log('Dream saved successfully:', savedDream);
    saveStatus.value = 'Saved!';
    tagStore.markAsSaved();
    
    // Call refresh function from store directly
    tagStore.refreshDreamsList(); 
    
    setTimeout(() => { saveStatus.value = null; }, 3000);
  } catch (error) {
    console.error('Error saving dream:', error);
    saveStatus.value = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    // Optionally use PrimeVue Toast for errors
    // toast.add({ severity: 'error', summary: 'Error', detail: 'Could not save dream', life: 3000 });
    // Keep error message visible longer
    setTimeout(() => { saveStatus.value = null; }, 5000);
  } finally {
    isSavingDream.value = false;
  }
}
// --- End Save Dream Logic ---

</script>

<style scoped>
/* Component-specific styles are now in assets/scss/components/tag-cloud.scss */
/* We keep this block for scoped styles as needed but don't add any until explicitly asked */
.save-status {
  text-align: right;
}
</style>