<template>
  <div class="tag-cloud" v-if="!loading">
    <div v-for="zone in tagStore.zones" :key="zone" class="zone-container">
      <h2>{{ zone }}</h2>
      <ForceGraph 
        :width="400" 
        :height="300" 
        :zone="zone" 
        @tagSelected="handleTagSelection"
        @secondaryTagSelected="handleSecondaryTagSelection"
      />
    </div>
    <div class="prompt-container">
      <h2>Generated Prompt:</h2>
      <p>{{ generatedPromptResult }}</p>
      <img v-if="imageUrl" :src="imageUrl" alt="Generated Image" />
    </div>
  </div>
  <div v-else class="loading">
    Loading...
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useTagStore } from '~/store/tagStore'
import ForceGraph from './ForceGraph.vue'
import { GoogleGenerativeAI } from "@google/generative-ai";
const config = useRuntimeConfig()

const apiKey = config.public.GEMINI_API_KEY;
const fluxApiKey = config.public.FLUX_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined");
}
if (!fluxApiKey) {
  throw new Error("FLUX_API_KEY is not defined");
}
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const imageUrl = ref('')
const generatedPromptResult = ref('')
let promptRequestId = 0;
let imageRequestId = 0;

const tagStore = useTagStore();
const { fetchTags } = tagStore

const loading = ref(true)

onMounted(async () => {
  await fetchTags()
  loading.value = false
})

const handleTagSelection = (tagId: string, zone: string) => {
  tagStore.toggleTag(tagId, zone)
}

const handleSecondaryTagSelection = (tagId: string) => {
  const primaryTag = tagStore.tags.find(tag => tag.secondaryTags?.some(secTag => secTag.id === tagId))
  if (primaryTag) {
    tagStore.toggleSecondaryTag(primaryTag.id, tagId)
  }
}

const generatedPrompt = computed(() => {
  const selectedPrimaryTags = tagStore.selectedTags.map(tag => tag.text)
  const selectedSecondaryTags = tagStore.selectedSecondaryTags.map(tag => tag.text)
  return [...selectedPrimaryTags, ...selectedSecondaryTags].join(', ')
})

const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const generatePrompt = debounce(async () => {
  const prompt = generatedPrompt.value;
  if (prompt.length > 0) {
    const currentRequestId = ++promptRequestId;

    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{
          text: `You are creating an image prompt based on the following tags: ${prompt}. You should create prompt as much exactly matching the tags as possible, do not make up tags, the result is a prompt for an image generator, no words before, no words after, just the prompt.`
        }]
      }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 1000
      }
    });

    if (currentRequestId === promptRequestId) {
      generatedPromptResult.value = await response.response.text();
    }
  }
}, 300);

const generateImage = async () => {
  const currentImageRequestId = ++imageRequestId;

  const url = "https://api.segmind.com/v1/fast-flux-schnell";

  const data = {
    "prompt": generatedPromptResult.value,
    "steps": 4,
    "seed": 1184522,
    "aspect_ratio": "1:1",
    "base64": true
  };

  try {
    const response = await $fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': fluxApiKey as string },
      body: data
    });

    if (currentImageRequestId === imageRequestId) {
      if (typeof response?.image === 'string') {
        imageUrl.value = `data:image/jpeg;base64,${response.image}`;
      } else {
        console.error('Unexpected response format:', response);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Watch for changes in the generatedPrompt computed property
watch(generatedPrompt, () => {
  generatePrompt();
});

// Watch for changes in the generatedPromptResult
watch(generatedPromptResult, () => {
  if (generatedPromptResult.value) {
    generateImage();
  }
});
</script>


<style lang="scss" scoped>
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  padding: 20px;
}

.zone-container {
  width: calc(33% - 20px);
  margin-bottom: 20px;
  
  h2 {
    text-align: center;
    margin-bottom: 10px;
  }
}

.prompt-container {
  width: 100%;
  margin-top: 20px;
  text-align: center;

  h2 {
    margin-bottom: 10px;
  }

  p {
    font-size: 1.2em;
    font-weight: bold;
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
}

.prompt-container img {
  max-width: 100%;
  height: auto;
  margin-top: 20px;
}
</style>
