<template>
  <Dialog
    v-model:visible="visibleInternal"
    modal
    :header="selectedImage?.promptText?.trim().substring(0, 200) + '...' || 'Image Details'"
    :style="{ width: '90vw', maxWidth: '1200px' }"
    content-class="p-0"
    class="custom-image-dialog glass-card"
  >
    <div
      v-if="selectedImage"
      class="image-modal-inner-content flex flex-col md:flex-row gap-4 items-start p-4 md:p-6 relative"
    >
      <div class="image-display-area flex-shrink-0 relative w-full md:w-2/3">
        <img
          :src="selectedImage.imageUrl"
          :alt="selectedImage.promptText || 'Selected image'"
          class="large-gallery-image cursor-pointer"
          @click="openFullscreen"
        >
      </div>
      <Button
        icon="pi pi-chevron-left"
        class="p-button-rounded p-button-secondary absolute top-1/2 -translate-y-1/2 z-20 modal-nav-button modal-nav-left"
        :disabled="images.length <= 1"
        style="width: 3rem; height: 3rem"
        @click="previousImage"
      />
      <Button
        icon="pi pi-chevron-right"
        class="p-button-rounded p-button-secondary absolute top-1/2 -translate-y-1/2 z-20 modal-nav-button modal-nav-right"
        :disabled="images.length <= 1"
        style="width: 3rem; height: 3rem"
        @click="nextImage"
      />
      <div class="info-container w-full md:w-1/3 md:pl-4">
        <h3 class="text-lg font-semibold mb-2">Prompt:</h3>
        <p class="prompt-modal-text text-sm mb-4 max-h-40 overflow-y-auto">
          {{ selectedImage.promptText || 'No prompt available' }}
        </p>
        <h3 class="text-lg font-semibold mb-2">Graph:</h3>
        <!-- <div v-if="snapshotGraphData" class="graph-wrapper mb-4">
          <ForceGraph
            :nodes="snapshotGraphData.nodes"
            :links="snapshotGraphData.links"
            :width="300"
            :height="200"
            :is-read-only="true"
          />
        </div>
        <div v-else class="prompt-modal-text text-sm mb-4">
          No graph available
        </div> -->
        <h3 class="text-lg font-semibold mb-1">Created:</h3>
        <p class="frosted-card-text text-sm mb-4">
          {{ new Date(selectedImage.createdAt).toLocaleString() }}
        </p>

        <div class="flex gap-2">
          <Button
            v-if="selectedImage.graphState"
            label="Load Snapshot"
            icon="pi pi-history"
            class="p-button-sm p-button-secondary mt-2 w-1/2"
            @click="handleLoadSnapshot"
          />
          <Button
            label="Download"
            icon="pi pi-download"
            class="p-button-sm w-1/2 mt-2"
            @click="handleDownload"
          />
        </div>
      </div>
    </div>
    <div v-else class="text-center py-10">
      <p>No image selected or image data is unavailable.</p>
    </div>
  </Dialog>
  <!-- Fullscreen Viewer -->
  <div v-if="isFullscreen" class="fullscreen-viewer">
    <img
      v-if="selectedImage"
      :src="selectedImage.imageUrl"
      :alt="selectedImage.promptText || 'Selected image'"
      class="fullscreen-image"
    >
    <Button
      icon="pi pi-times"
      class="p-button-rounded p-button-secondary fullscreen-close-button"
      style="width: 3rem; height: 3rem"
      @click="closeFullscreen"
    />
    <Button
      icon="pi pi-chevron-left"
      class="p-button-rounded p-button-secondary absolute top-1/2 -translate-y-1/2 z-20 modal-nav-button modal-nav-left"
      :disabled="images.length <= 1"
      style="width: 3rem; height: 3rem"
      @click="previousImage"
    />
    <Button
      icon="pi pi-chevron-right"
      class="p-button-rounded p-button-secondary absolute top-1/2 -translate-y-1/2 z-20 modal-nav-button modal-nav-right"
      :disabled="images.length <= 1"
      style="width: 3rem; height: 3rem"
      @click="nextImage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useImageDownloader } from '~/composables/useImageDownloader'
import { useTagStore } from '~/store/tagStore'
import { useRouter } from 'vue-router'
import type { GraphNode } from '~/types/graph'

interface GraphState {
  tags: GraphNode[]
  focusedZone: string
  // Include other properties from the actual graphState object if known
}

interface GalleryImage {
  id: number
  imageUrl: string
  promptText?: string | null
  createdAt: string
  dreamId: number
  graphState?: GraphState
}

const props = defineProps<{
  images: GalleryImage[]
  modelValue: boolean
  startIndex?: number
  context: 'gallery' | 'dream-session'
}>()
const emit = defineEmits(['update:modelValue'])

const { downloadImage } = useImageDownloader()
const tagStore = useTagStore()
const router = useRouter()

const isFullscreen = ref(false)

const visibleInternal = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
})

const currentIndex = ref(props.startIndex ?? 0)
watch(
  () => props.startIndex,
  (v) => {
    if (typeof v === 'number') currentIndex.value = v
  }
)

const selectedImage = computed(() => {
  if (props.images.length && currentIndex.value >= 0 && currentIndex.value < props.images.length) {
    return props.images[currentIndex.value]
  }
  return null
})

// const snapshotGraphData = computed<{ nodes: GraphNode[]; links: GraphLink[] } | null>(() => {
//   const state = selectedImage.value?.graphState
//   if (state && Array.isArray(state.tags) && state.focusedZone) {
//     // Treat tags array as GraphNode[] to include all required properties
//     const allTags = state.tags as GraphNode[]
//     // Filter nodes to the focused zone
//     const nodes: GraphNode[] = allTags.filter((tag) => tag.zone === state.focusedZone)
//     // Construct links for parent-child relationships within the zone
//     const links: GraphLink[] = nodes
//       .filter((tag) => typeof tag.parentId === 'string')
//       .map((tag) => ({ source: tag.parentId as string, target: tag.id, value: 1 }))
//     return { nodes, links }
//   }
//   return null
// })

function openFullscreen() {
  if (selectedImage.value) {
    isFullscreen.value = true
  }
}

function closeFullscreen() {
  isFullscreen.value = false
}

function nextImage() {
  if (props.images.length) currentIndex.value = (currentIndex.value + 1) % props.images.length
}
function previousImage() {
  if (props.images.length)
    currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length
}
function handleDownload() {
  if (selectedImage.value)
    downloadImage(selectedImage.value.imageUrl, selectedImage.value.promptText)
}

async function handleLoadSnapshot() {
  if (!selectedImage.value || !selectedImage.value.graphState) return
  const image = selectedImage.value

  if (props.context === 'gallery' && image.dreamId) {
    // This action needs to be created in the store
    tagStore.setPendingSnapshot(image)
    await router.push(`/dream/${image.dreamId}`)
  } else if (props.context === 'dream-session') {
    // Stash the current session if one isn't already stashed
    if (!tagStore.stashedSessionState) {
      tagStore.stashCurrentSession()
    }

    const snapshotPayload = {
      ...image,
      promptText: image.promptText ?? undefined,
      graphState: image.graphState,
    }
    tagStore.loadStateFromImageSnapshot(snapshotPayload)
    tagStore.viewingSnapshotImageId = image.id
    visibleInternal.value = false // Close modal after loading
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (!visibleInternal.value) return

  switch (event.key) {
    case 'Escape':
      if (isFullscreen.value) {
        closeFullscreen()
      } else {
        visibleInternal.value = false
      }
      break
    case 'ArrowRight':
      nextImage()
      break
    case 'ArrowLeft':
      previousImage()
      break
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style lang="scss" scoped>
@use '~/assets/scss/mixins/frosted-glass' as fg;
.large-gallery-image {
  width: 100%;
  max-height: calc(80vh - 100px);
  object-fit: contain;
  border-radius: 8px;
}
.modal-nav-button {
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s, background-color 0.2s;
  background-color: rgba(45, 45, 45, 0.65) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}
.modal-nav-button:hover {
  opacity: 1;
  transform: translateY(-50%) scale(1.05);
  background-color: rgba(60, 60, 60, 0.85) !important;
}
.modal-nav-button:disabled {
  opacity: 0.3 !important;
  cursor: not-allowed;
  background-color: rgba(45, 45, 45, 0.4) !important;
}
.modal-nav-left {
  left: -4rem;
}
.modal-nav-right {
  right: -4rem;
}
@media (max-width: 767px) {
  .modal-nav-left {
    left: 0.5rem;
  }
  .modal-nav-right {
    right: 0.5rem;
  }
  .image-modal-inner-content {
    padding: 0.75rem;
  }
  .info-container {
    padding-left: 0 !important;
    max-height: none;
    padding-top: 1rem;
  }
  .large-gallery-image {
    max-height: 60vh;
  }
}
.custom-image-dialog .info-container {
  color: var(--text-color-secondary, #d1d5db);
  height: calc(80vh - 100px);
  overflow-y: auto;
}
.custom-image-dialog .info-container h3 {
  color: var(--text-color, #f9fafb);
}
.custom-image-dialog .prompt-modal-text {
  background-color: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-color, #f3f4f6);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}
.image-display-area {
  min-height: 200px;
}

.graph-wrapper {
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  height: 200px; /* Or adjust as needed */
  background-color: rgba(0, 0, 0, 0.2);
}




.cursor-pointer {
  cursor: pointer;
}

.fullscreen-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1200;

  .modal-nav-left {
    left: 1rem;
  }
  .modal-nav-right {
    right: 1rem;
  }
}

.fullscreen-image {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
}

.fullscreen-close-button {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 1201;
  // Style to match nav buttons
  opacity: 0.7;
  transition: opacity 0.2s, transform 0.2s, background-color 0.2s;
  background-color: rgba(45, 45, 45, 0.65) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: white !important;

  &:hover {
    opacity: 1;
    transform: scale(1.05);
    background-color: rgba(60, 60, 60, 0.85) !important;
  }
}
</style>
