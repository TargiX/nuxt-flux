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
          v-if="imageUrl"
          :src="imageUrl"
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
        <p class="text-[#474565]" v-else>{{ generatedPromptResult }}</p>
        
     
      </div>
      <div class="flex justify-between w-full">
        <p class="w-full !text-left text-xs selected-tags-display text-[#6d80a4]">Selected Tags: <span class="font-bold">{{ generatedPrompt}}</span></p>
        <Button 
          @click="generateImage" 
          severity="primary"
          :disabled="!(isManualMode ? manualPrompt : generatedPromptResult) || isGeneratingImage"
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

  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useTagStore } from '~/store/tagStore';
import ForceGraph from './ForceGraph.vue';
import ZoneSelector from './ZoneSelector.vue';
import { generateImagePrompt } from '~/services/promptGenerationService';
import { generateImageFromPrompt } from '~/services/imageGenerationService';

const tagStore = useTagStore();
const focusedZone = computed(() => tagStore.focusedZone);
const zoneOptions = ref([...tagStore.zones]);
const graphNodes = computed(() => tagStore.graphNodes);
const graphLinks = computed(() => tagStore.graphLinks);

const selectedZone = ref(focusedZone.value);

watch(selectedZone, (newZone) => {
  if (newZone) {
    switchToZone(newZone);
  }
});

const isManualMode = ref(false)
const manualPrompt = ref('')
const imageUrl = ref<string | null>(null);
const generatedPromptResult = ref('')
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
        generatedPromptResult.value = result;
      }
    } catch (error) {
      console.error('Failed to generate prompt:', error);
      if (currentRequestId === promptRequestId) {
        generatedPromptResult.value = 'Error generating prompt.'; 
      }
    } finally {
      if (currentRequestId === promptRequestId) {
        isGeneratingPrompt.value = false;
      }
    }
  } else {
    generatedPromptResult.value = '';
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
  const promptText = isManualMode.value ? manualPrompt.value : generatedPromptResult.value;
  
  if (!promptText) {
    console.error('No prompt text available for image generation.');
    return;
  }

  isGeneratingImage.value = true;
  imageUrl.value = null;
  const currentImageRequestId = ++imageRequestId;

  try {
    const generatedImageUrl = await generateImageFromPrompt(promptText);
    
    if (currentImageRequestId === imageRequestId) {
      imageUrl.value = generatedImageUrl;
      if (!generatedImageUrl) {
        console.error('Image generation service returned null.');
      }
    }
  } catch (error) {
    console.error('Error generating image:', error);
    if (currentImageRequestId === imageRequestId) {
      imageUrl.value = null;
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
</script>

<style scoped>
/* Component-specific styles are now in assets/scss/components/tag-cloud.scss */
/* We keep this block for scoped styles as needed but don't add any until explicitly asked */
</style>