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
            @click="saveDream"
            severity="secondary" 
            :disabled="isSavingDisabled"
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
            :disabled="isGenerationDisabled"
            class="flex items-center gap-2 flex-nowrap whitespace-nowrap px-8 py-1"
          >
            <ProgressSpinner
              v-if="isGeneratingImage"
              class="w-4 h-4 progress-spinner" 
              strokeWidth="8" 
              fill="transparent"
            />
            {{ isGeneratingImage ? 'Generating...' : (isImageCooldown ? 'Cooldown...' : 'Generate Image') }}
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
import type { Tag } from '~/types/tag';

const tagStore = useTagStore();
const toast = useToast();

const focusedZone = computed(() => tagStore.focusedZone);
const zoneOptions = ref([...tagStore.zones]);
const graphNodes = computed(() => tagStore.graphNodes);
const graphLinks = computed(() => tagStore.graphLinks);

const selectedZone = ref(focusedZone.value);

const isSavingDream = ref(false);
const saveStatus = ref<string | null>(null);

watch(selectedZone, (newZone) => {
  if (newZone) {
    switchToZone(newZone);
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
  return !(isManualMode.value ? manualPrompt.value : tagStore.currentGeneratedPrompt) || isGeneratingImage.value || isSavingDream.value || isImageCooldown.value
})

const isSavingDisabled = computed(() => {
  return isSavingDream.value || tagStore.tags.filter(t => t.selected).length === 0
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
    } catch (error: any) {
      console.error('Failed to generate prompt:', error);
      if (currentRequestId === promptRequestId) {
        tagStore.setCurrentGeneratedPrompt('Error generating prompt.');
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

watch(generatedPrompt, () => {
  triggerPromptGeneration();
});

onMounted(() => {
  triggerPromptGeneration();
});

async function handleNodeClick(id: string) {
  console.log('TagCloud received nodeClick:', id);
  try {
    await tagStore.toggleTag(id);
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

function switchToZone(zone: string) {
  console.log(`Switching to ${zone}`);
  tagStore.setFocusedZone(zone);
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
      // toast.add({
      //   severity: 'success',
      //   summary: 'Image Generated',
      //   detail: 'Image generated successfully!',
      //   life: 3000,
      // });
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

async function saveDream() {
  if (isSavingDream.value) return;
  
  isSavingDream.value = true;
  saveStatus.value = null;

  const plainTags = JSON.parse(JSON.stringify(tagStore.tags));
  const dreamData = {
    focusedZone: focusedZone.value,
    tags: plainTags,
    generatedPrompt: tagStore.currentGeneratedPrompt,
    imageUrl: tagStore.currentImageUrl
  };

  const title = dreamData.tags
    .filter((t: Tag) => t.selected)
    .slice(0, 3)
    .map((t: Tag) => t.text)
    .join(', ') || 'Untitled Dream';

  try {
    const response = await $fetch<{ id: number }>('/api/dreams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        data: dreamData,
      })
    });
    console.log('Dream saved successfully:', response);
    saveStatus.value = 'Saved!';
    toast.add({ severity: 'success', summary: 'Success', detail: 'Dream saved successfully!', life: 3000 });
    
    tagStore.markAsSaved();
    
    tagStore.refreshDreamsList(); 
    
    setTimeout(() => { saveStatus.value = null; }, 3000);
  } catch (error: any) {
    console.error('Error saving dream:', error);
    let errorMessage = 'Could not save dream due to an unknown error.';
    if (error.data && error.data.message) {
      errorMessage = error.data.message;
    } else if (error.statusMessage) {
      errorMessage = error.statusMessage;
    }
    saveStatus.value = `Error: ${errorMessage}`;
    toast.add({ severity: 'error', summary: 'Save Failed', detail: errorMessage, life: 5000 });
    setTimeout(() => { saveStatus.value = null; }, 5000);
  } finally {
    isSavingDream.value = false;
  }
}

</script>

<style scoped>
/* Component-specific styles are now in assets/scss/components/tag-cloud.scss */
/* We keep this block for scoped styles as needed but don't add any until explicitly asked */
.save-status {
  text-align: right;
}
</style>