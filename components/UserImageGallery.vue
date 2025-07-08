<template>
  <div class="user-image-gallery">
    <div v-if="pending && images.length === 0" class="loading-state text-center py-10">
      <i class="pi pi-spin pi-spinner text-4xl mb-3"></i>
      <p>Loading your masterpieces...</p>
    </div>
    <div v-else-if="error" class="error-state text-center py-10">
      <i class="pi pi-times-circle text-4xl text-red-500 mb-3"></i>
      <p class="text-red-500">Could not load your gallery. Please try again later.</p>
      <pre v-if="error.data" class="text-xs text-gray-500 mt-2">{{ error.data }}</pre>
    </div>
    <div v-else-if="images.length === 0" class="empty-state text-center py-10">
      <i class="pi pi-image text-4xl text-gray-400 mb-3"></i>
      <p>Your gallery is empty. Go create some amazing images!</p>
    </div>
    <div v-else class="image-grid">
      <!-- eslint-disable-next-line vue/valid-v-for -->
      <div v-for="(image, index) in images" :key="image.id" class="image-card glass-card-hoverable">
        <img
          :src="image.imageUrl"
          :alt="image.promptText || 'User generated image'"
          class="gallery-image cursor-pointer"
          @click="openImageModal(index)"
        />
        <div class="image-info p-3">
          <div class="flex justify-between items-center">
            <p
              v-if="image.promptText"
              class="prompt-text text-xs truncate flex-grow mr-2"
              :title="image.promptText"
            >
              {{ image.promptText }}
            </p>
            <Button
              v-tooltip.top="'Download image'"
              icon="pi pi-download"
              class="p-button-text p-button-secondary p-button-sm flex items-center justify-center"
              style="width: 2.25rem; height: 2.25rem"
              @click="handleDownloadImage(image.imageUrl, image.promptText)"
            />
          </div>
          <p class="date-text text-xs text-gray-400 mt-1">
            {{ new Date(image.createdAt).toLocaleDateString() }}
          </p>
        </div>
      </div>
    </div>

    <ImageViewerModal
      v-model="viewerVisible"
      :images="images"
      :start-index="viewerStartIndex"
      context="gallery"
    />
  </div>
</template>

<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ref, onMounted } from 'vue'
import { useImageDownloader } from '~/composables/useImageDownloader'
import ImageViewerModal from './ImageViewerModal.vue'
import Button from 'primevue/button'

interface GalleryImage {
  id: number
  imageUrl: string
  promptText?: string | null
  createdAt: string // Or Date, adjust based on API response
  dreamId: number
  graphState?: unknown
  // Add other fields if needed from the API response, e.g., graphState
}

const images = ref<GalleryImage[]>([])
const pending = ref(true)
const error = ref<{ data?: unknown } | null>(null)

const { downloadImage } = useImageDownloader()

const viewerVisible = ref(false)
const viewerStartIndex = ref(0)

async function fetchUserImages() {
  pending.value = true
  error.value = null
  try {
    // eslint-disable-next-line no-undef
    const fetchedImages = await $fetch<GalleryImage[]>('/api/images/user')
    images.value = fetchedImages
  } catch (err) {
    console.error('Failed to fetch user images for gallery:', err)
    error.value = err as { data?: unknown }
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  fetchUserImages()
})

function openImageModal(index: number) {
  viewerStartIndex.value = index
  viewerVisible.value = true
}

function handleDownloadImage(imageUrl: string, promptText?: string | null) {
  downloadImage(imageUrl, promptText)
}
/* eslint-enable @typescript-eslint/no-unused-vars */
</script>

<style scoped>
.user-image-gallery {
  /* Add any specific styling for the gallery container if needed */
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); /* Responsive grid */
  gap: 1rem;
}

.image-card {
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.2s ease-in-out;
  position: relative; /* For positioning download button if needed more precisely */
}

.image-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2); /* Enhanced shadow on hover */
}

.gallery-image {
  width: 100%;
  height: 200px; /* Fixed height for uniform card size */
  object-fit: cover;
  display: block;
}

.image-info {
  background-color: rgba(0, 0, 0, 0.1);
}

.prompt-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.loading-state i,
.error-state i,
.empty-state i {
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.glass-card-hoverable {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-color);
}

/* Modal Styles */
.large-gallery-image {
  width: 100%;
  max-height: calc(80vh - 100px); /* Adjust based on desired padding/header height */
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
  /* Positioned relative to image-modal-inner-content, which has padding */
  left: -4rem; /* Sits within the padding of the parent */
}

.modal-nav-right {
  /* Positioned relative to image-modal-inner-content, which has padding */
  right: -4rem; /* Sits within the padding of the parent */
}

/* Scoped styles for the content within THIS specific dialog instance */
/* The general dialog chrome (header, background) is themed globally */

.custom-image-dialog .image-modal-inner-content {
  /* p-4 md:p-6 applied via classes in template */
  /* Background for this inner content area will come from --p-dialog-content-background (set globally) */
}

.custom-image-dialog .info-container {
  color: var(--text-color-secondary, #d1d5db);
  max-height: calc(80vh - 100px);
  overflow-y: auto;
}
.custom-image-dialog .info-container h3 {
  color: var(--text-color, #f9fafb);
}
.custom-image-dialog .prompt-modal-text {
  background-color: rgba(255, 255, 255, _0.04); /* Very subtle background for the prompt box */
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-color, #f3f4f6);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
}

.image-display-area {
  min-height: 200px;
}

@media (max-width: 767px) {
  .modal-nav-left {
    left: 0.5rem;
  }
  .modal-nav-right {
    right: 0.5rem;
  }
  .custom-image-dialog .image-modal-inner-content {
    padding: 0.75rem;
  }
  .custom-image-dialog .info-container {
    padding-left: 0 !important;
    max-height: none;
    padding-top: 1rem;
  }
  .large-gallery-image {
    max-height: 60vh;
  }
}

/* Ensure loading/error/empty states are legible */
.loading-state,
.error-state,
.empty-state {
  color: var(--text-color-secondary, #9ca3af);
}
.error-state p {
  color: var(--red-400, #f87171); /* Assuming you have color utils or direct hex */
}
.error-state i {
  color: var(--red-500, #ef4444);
}
</style>
