<template>
   <div class="main-zone grid grid-cols-2 tw-gap-4">
    
    <!-- Top Left: Graph -->
    <div class="graph-container glass-card">
      <h2>{{ focusedZone }}</h2>
      <ForceGraph
        :width="800"
        :height="600"
        :nodes="graphNodes"
        :links="graphLinks"
        @nodeClick="handleNodeClick"
        @nodePositionsUpdated="handleNodePositionsUpdated"
      >
        <!-- Zone selector will be moved here via slot later -->
        <template #controls>
          <div class="zone-selector mt-4">
            <SelectButton v-model="selectedZone" :options="zoneOptions" class="flex flex-wrap justify-center" />
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
import { useRuntimeConfig } from '#app';
import { GoogleGenerativeAI } from '@google/generative-ai';

const config = useRuntimeConfig();
const genAI = new GoogleGenerativeAI(config.public.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const imageModel = genAI.getGenerativeModel({ 
  model: 'gemini-2.0-flash-exp-image-generation'
  // The responseModalities will be specified in the request
});

const tagStore = useTagStore();
const focusedZone = computed(() => tagStore.focusedZone);
// Create a ref using the zones array directly from the store
const zoneOptions = ref([...tagStore.zones]);
const graphNodes = computed(() => tagStore.graphNodes);
const graphLinks = computed(() => tagStore.graphLinks);

// Use ref for the selected zone and sync with the store
const selectedZone = ref(focusedZone.value);

// Watch for changes to selectedZone and update the store
watch(selectedZone, (newZone) => {
  if (newZone) {
    switchToZone(newZone);
  }
});

// Add this ref near the top of the script section with other refs
const isManualMode = ref(false)
const manualPrompt = ref('')
const imageUrl = ref('')
const generatedPromptResult = ref('')
const isGeneratingImage = ref(false)

let promptRequestId = 0
let imageRequestId = 0

const generatedPrompt = computed(() => {
  // Get primary selected tags
  const selectedPrimaryTags = tagStore.tags
    .filter(tag => tag.selected)
    .map(tag => tag.text);
  
  return  selectedPrimaryTags.join(', ')
})


// Also watch for changes in the store's zones to update options
watch(() => tagStore.zones, () => {
  zoneOptions.value = [...tagStore.zones];
}, { deep: true });

// Also watch for changes in the store's focusedZone
watch(focusedZone, (newZone) => {
  selectedZone.value = newZone;
});

// Watch for changes in the generatedPrompt computed property to trigger prompt generation
watch(generatedPrompt, () => {
  generatePrompt();
});

// Generate the prompt when the component is mounted
onMounted(() => {
  if (generatedPrompt.value) {
    generatePrompt();
  }
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
  isGeneratingImage.value = true
  const currentImageRequestId = ++imageRequestId

  const promptText = isManualMode.value ? manualPrompt.value : generatedPromptResult.value
  
  if (!promptText) {
    console.error('No prompt text available')
    isGeneratingImage.value = false
    return
  }

  try {
    console.log('Generating image with prompt:', promptText)
    
    // Create a proper request object according to the Gemini API
    const response = await imageModel.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ],
      generationConfig: {
        // @ts-ignore - The TypeScript definitions might not be updated for this new API
        responseModalities: ['Text', 'Image']
      }
    })
    
    if (currentImageRequestId === imageRequestId) {
      const result = response.response
      
      if (result && result.candidates && result.candidates.length > 0) {
        const parts = result.candidates[0].content.parts
        
        for (const part of parts) {
          if (part.inlineData) {
            // Successfully found an image
            imageUrl.value = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            console.log('Image generated successfully')
            break
          } else if (part.text) {
            console.log('Generated text:', part.text)
          }
        }
      }
      
      if (!imageUrl.value) {
        console.error('No image was generated in the response')
      }
    }
  } catch (error) {
    console.error('Error generating image:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
  } finally {
    if (currentImageRequestId === imageRequestId) {
      isGeneratingImage.value = false
    }
  }
}

// Simple debounce function
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

const generatePrompt = debounce(async () => {
  if (isManualMode.value) return // Skip auto-generation if in manual mode
  
  const prompt = generatedPrompt.value
  if (prompt.length > 0) {
    const currentRequestId = ++promptRequestId

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are creating an image prompt based on the following tags: ${prompt}. You should create prompt as much exactly matching the tags as possible, based on the tags but transformed into a prompt for an image generator, the result is a prompt for an image generator, no words before, no words after, just the prompt.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1000,
      },
    })

    if (currentRequestId === promptRequestId) {
      generatedPromptResult.value = await response.response.text()
    }
  }
}, 300)

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
</script>

<style scoped>
@import '@/assets/scss/components/tag-cloud.scss';
/* Component-specific styles are now in assets/scss/components/tag-cloud.scss */
/* We keep this block for scoped styles as needed but don't add any until explicitly asked */
</style>