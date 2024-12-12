<template>
  <div class="tag-cloud" v-if="!loading">
    <div class="main-zone grid grid-cols-2 tw-gap-4">
      <div class="graph-container">
        <h2>{{ focusedZone }}</h2>
        <ForceGraph
          :key="focusedZone"
          :width="600"
          :height="728"
          :zone="focusedZone"
          ref="forceGraphRef"
          class="main-graph"
          @tagSelected="handleTagSelection"
          @zoneChange="handleZoneChange"
          :zoomConfig="{ scale: 1.4, translateX: -90, translateY: -130 }"
        />
        <div class="preview-zones">
          <div
            v-for="zone in previewZones"
            :key="zone"
            class="preview-zone"
            @click="setFocusedZone(zone)"
          >
            <h3>{{ zone }}</h3>
            <ForceGraph
              :width="100"
              :height="150"
              :zone="zone"
              :preview="true"
              :zoomConfig="{ scale: 0.3, translateX: 45, translateY: 50 }"
            />
          </div>
        </div>
      </div>

      <div class="prompt-container">
        <h2>Image:</h2>
        <div class="image-container">
          <img v-if="imageUrl" :src="imageUrl" alt="Generated Image" class="generated-image" />
          <div v-else-if="isGeneratingImage" class="loader-container">
            <div class="loader">
              <div class="particles">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
              </div>
            </div>
            <p class="loader-text">Generating your image...</p>
          </div>
          <div v-else class="placeholder-container"></div>
        </div>

        <div class="prompt-box">
          <div class="prompt-header">
            <h2>Generated Prompt:</h2>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" v-model="isManualMode" class="sr-only peer" />
              <div
                class="relative w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
              ></div>
              <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"
                >Manual Mode</span
              >
            </label>
          </div>

          <textarea
            v-if="isManualMode"
            v-model="manualPrompt"
            class="manual-prompt-input"
            placeholder="Enter your prompt..."
          ></textarea>
          <p v-else>{{ generatedPromptResult }}</p>

          <button
            @click="generateImage"
            :disabled="!(isManualMode ? manualPrompt : generatedPrompt) || isGeneratingImage"
            class="flex items-center gap-2"
          >
            <ArrowPathIcon v-if="isGeneratingImage" class="animate-spin h-5 w-5" />
            {{ isGeneratingImage ? 'Generating...' : 'Generate Image' }}
          </button>
        </div>
        <p class="w-full !text-left text-xs">
          Selected Tags: <span class="font-bold">{{ generatedPrompt }}</span>
        </p>
      </div>
    </div>
  </div>

  <div v-else class="loading">Loading...</div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useTagStore } from '~/store/tagStoreV2'
import ForceGraph from './ForceGraph.vue'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { ArrowPathIcon } from '@heroicons/vue/24/solid'
import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai'
import { useRuntimeConfig } from '#app'
import { mockTags } from '~/store/mockTags'
const config = useRuntimeConfig()
const apiKey = config.public.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined')
}
const genAI = new GoogleGenerativeAI(apiKey)
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' })

const imageUrl = ref('')
const generatedPromptResult = ref('')
const isManualMode = ref(false)
const manualPrompt = ref('')
const isGeneratingImage = ref(false)
let promptRequestId = 0
let imageRequestId = 0

const tagStore = useTagStore()
const {
  fetchTags,
  zones,
  focusedZone,
  setFocusedZone,
  selectedNodes,
  toggleNodeSelection,
} = tagStore

const loading = ref(true)

const previewZones = computed(() => {
  return zones.filter((zone) => zone !== focusedZone)
})
const forceGraphRef = ref<InstanceType<typeof ForceGraph> | null>(null)

onMounted(async () => {
  await fetchTags()
  loading.value = false
})

const handleTagSelection = async (tagId: string, zone: string) => {
  console.log('this is tagId', tagId)
  console.log('this is zone', zone)
  const tag = tagStore.findNode(zone, tagId)
  if (!tag) return

  // Find currently selected node in the same zone (other than this one)
  const currentSelected = selectedNodes.find((n) => n.zone === zone && n.id !== tagId)
  if (currentSelected) {
    // Unselect currently selected node
    toggleNodeSelection(zone, currentSelected.id)
    // Remove its dynamic children
    tagStore.removeDynamicChildren(zone, currentSelected.id)
  }

  if (!tag.selected) {
    // Select this node
    toggleNodeSelection(zone, tagId)
    // Set loading state
    tagStore.setNodeLoading(tagId, true)

    // Temporarily store existing children
    const preconfiguredChildren = [...tag.children]

    // Clear children to avoid showing them before we get dynamic tags
    tag.children.splice(0, tag.children.length)

    // Generate new dynamic tags
    const newTagsTexts = await generateRelatedTags(tag.text)
    const newTags = newTagsTexts.map((txt, index) => ({
      id: `${tagId}-dynamic-${index}`,
      text: txt,
      zone: `${zone}-secondary`,
      selected: false,
      hidden: false,
      x: tag.x || 0,
      y: tag.y || 0,
      fx: null,
      fy: null,
      parentId: tagId,
      children: [],
      metadata: { origin: 'ai-generated', dynamic: true }, // Mark as dynamic
    }))

    // Clear loading
    tagStore.setNodeLoading(tagId, false)

    // Add back preconfigured children
    for (const child of preconfiguredChildren) {
      // Ensure these are also marked properly if needed
      child.metadata = child.metadata || {}
      child.metadata.preconfigured = true
      tagStore.addChildNode(zone, tagId, child)
    }

    // Add dynamic children
    for (const child of newTags) {
      tagStore.addChildNode(zone, tagId, child)
    }
  } else {
    // Unselect this node
    toggleNodeSelection(zone, tagId)
    // Remove dynamic children
    tagStore.removeDynamicChildren(zone, tagId)
  }
  forceGraphRef.value?.updateGraph()
}

const handleZoneChange = (zone: string) => {
  setFocusedZone(zone)
}

const generatedPrompt = computed(() => {
  return selectedNodes.map((node) => node.text).join(', ')
})

// Debounce utility
const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
const generatePrompt = () => {
  return new Promise((resolve) => {
    const debouncedGenerate = debounce(async () => {
      if (isManualMode.value) {
        // In manual mode, we just resolve immediately with no changes
        resolve(null)
        return
      }

      const prompt = generatedPrompt.value // From computed selected tags
      if (prompt && prompt.length > 0) {
        const currentRequestId = ++promptRequestId

        const response = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `You are creating an image prompt based on the following tags: ${prompt}. You should create a prompt that unites these tags into a coherent concept for an image generator. Do not add extra words beyond what is needed. Return only the prompt itself.`,
                },
              ],
            },
          ],
          safetySettings: [
            {
              category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_HARASSMENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
            {
              category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
              threshold: HarmBlockThreshold.BLOCK_NONE,
            },
          ],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1000,
          },
        })

        if (currentRequestId === promptRequestId) {
          generatedPromptResult.value = await response.response.text()
          resolve(generatedPromptResult.value)
        } else {
          // Another request was made in the meantime, ignore this result
          resolve(null)
        }
      } else {
        // No prompt or empty, reset result
        generatedPromptResult.value = ''
        resolve(null)
      }
    }, 300)

    debouncedGenerate()
  })
}

// Update the generateImage function:
const generateImage = async () => {
  await generatePrompt() // Ensure prompt is up-to-date before generating image
  isGeneratingImage.value = true
  const currentImageRequestId = ++imageRequestId

  const url = 'https://api.segmind.com/v1/fast-flux-schnell'
  const data = {
    prompt: isManualMode.value ? manualPrompt.value : generatedPromptResult.value,
    steps: 4,
    seed: 1184522,
    aspect_ratio: '1:1',
    base64: true,
  }

  try {
    const response = await $fetch(url, {
      method: 'POST',
      headers: { 'x-api-key': fluxApiKey as string },
      body: data,
    })

    if (currentImageRequestId === imageRequestId) {
      if (typeof response?.image === 'string') {
        imageUrl.value = `data:image/jpeg;base64,${response.image}`
      } else {
        console.error('Unexpected response format:', response)
      }
    }
  } catch (error) {
    console.error('Error generating image:', error)
  } finally {
    if (currentImageRequestId === imageRequestId) {
      isGeneratingImage.value = false
    }
  }
}

// Watch for isManualMode changes:
watch(isManualMode, (newValue) => {
  if (newValue) {
    // When switching to manual mode, initialize with current prompt content
    // Use generatedPromptResult if available, else fallback to generatedPrompt
    manualPrompt.value = generatedPromptResult.value || generatedPrompt.value
  } else {
    // Switching back to auto mode triggers a prompt regeneration
    generatePrompt()
  }
})

// Update generateRelatedTags function:
const generateRelatedTags = async (parentTag: string) => {
  // Attempt to find existing tags in mockTags
  console.log('this is parent tag', parentTag)
  console.log('this is focused zone', mockTags[focusedZone].flat().find((tag) => tag.text === parentTag))

  const mockTagData = Object.values(mockTags[focusedZone])
    .flat()
    .find((tag) => tag.text === parentTag)
  const existingTags = mockTagData?.children.map((tag) => tag.text.toLowerCase()) || [] // Adjust if secondary tags differ now

  // Create a set for case-insensitive comparison
  const existingTagSet = new Set(existingTags)

  const response = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `You are helping users find relevant tags for image generation. 
            For the main subject "${parentTag}", suggest 6 additional descriptive tags:
            
            Requirements:
            - Each tag is 1-2 words
            - Capitalize first letter
            - Avoid duplicates of: ${existingTags.join(', ')}
            - Relevant, imagery-focused, helpful for creative image variations.
            
            Return as a JSON array of strings, no explanation.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 200,
    },
  })

  const text = await response.response.text()
  try {
    const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
    const tags = JSON.parse(cleanedText)

    // Filter duplicates
    const uniqueTags = tags.filter((tag: string) => !existingTagSet.has(tag.toLowerCase()))
    return Array.isArray(uniqueTags) ? uniqueTags.slice(0, 5) : []
  } catch (error) {
    console.error('Failed to parse generated tags:', error)
    console.error('Raw response:', text)
    return []
  }
}
</script>

<style lang="scss" scoped>
.tag-cloud {
  display: flex;
  flex-direction: column;
  padding: 0px 20px 0 20px;
  width: 100%;
}

.main-zone {
  margin-bottom: 20px;
  width: 100%;

  h2 {
    text-align: center;
    margin-bottom: 2px;
  }
  .main-graph {
    width: 100% !important;
    border: 1px solid #cfcfcf;
    border-radius: 10px;
    margin-bottom: 20px;
    background: #fff;
  }
}

/* Add these new container styles */
.graph-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.prompt-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 0px 0 20px;
  min-height: 600px; /* Ensures minimum height even without image */

  h2 {
    margin-bottom: 2px;
  }

  .prompt-box {
    width: 100%;
    min-height: 120px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 3px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    p {
      font-size: 0.9em;
      line-height: 1.5;
      margin: 0;
      padding: 0 0 15px 0;
      color: #333;
      text-align: left;
      flex-grow: 1;
      min-height: 115px;
    }

    button {
      align-self: flex-end;
      padding: 8px 16px;
      font-size: 0.95em;
      background-color: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background-color: #45a049;
      }
    }

    .prompt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 3px;

      .manual-mode-toggle {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9em;
        cursor: pointer;

        input[type='checkbox'] {
          cursor: pointer;
        }
      }
    }

    .manual-prompt-input {
      width: 100%;
      min-height: 100px;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 15px;
      font-size: 0.9em;
      line-height: 1.5;
      resize: vertical;

      &:focus {
        outline: none;
        border-color: #4caf50;
      }
    }
  }

  .image-container {
    width: 100%;
    aspect-ratio: 1 / 1;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    border-radius: 8px;
    overflow: hidden;
  }

  .placeholder-container {
    width: 100%;
    height: 100%;
    background-color: #f5f5f5;
    border: 2px dashed #ddd;
    border-radius: 8px;
  }

  .generated-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 8px;
  }

  button {
    padding: 10px 20px;
    font-size: 1em;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    margin-top: auto;
    width: fit-content;

    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background-color: #45a049;
    }
  }
}

.preview-zones {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.preview-zone {
  width: calc(20% - 10px);
  padding-top: 5px;
  border: 1px solid #cfcfcf;
  border-radius: 10px;
  cursor: pointer;
  transition: transform 0.2s;
  background: #fff;
  &:hover {
    transform: scale(1.05);
  }

  h3 {
    text-align: center;
    margin-bottom: 5px;
  }
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
}

.loader-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
  border-radius: 8px;
}

.loader {
  width: 120px;
  height: 120px;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: rotate 10s linear infinite;
}

.particle {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4caf50;
  opacity: 0.6;
  left: calc(50% - 5px);
  top: calc(50% - 5px);

  @for $i from 1 through 8 {
    &:nth-child(#{$i}) {
      transform: rotate($i * 45deg) translateY(-30px);
      animation: particle-animation 2s infinite;
      animation-delay: $i * 0.2s;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes particle-animation {
  0% {
    transform: rotate(0deg) translateY(-30px) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: rotate(180deg) translateY(-40px) scale(1.5);
    opacity: 1;
    background: #2196f3;
  }
  100% {
    transform: rotate(360deg) translateY(-30px) scale(1);
    opacity: 0.6;
  }
}

.loader-text {
  margin-top: 20px;
  color: #666;
  font-size: 0.9em;
  animation: text-pulse 2s ease-in-out infinite;
}

@keyframes text-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
