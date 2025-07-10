<template>
  <div class="image-strip-container">
    <h2 class="strip-title">
      Images -
      <span v-if="!tagStore.stashedSessionState">Current Session</span>
      <span v-else>Viewing Snapshot</span>
    </h2>

    <div class="image-scroll-area">
      <div class="images-wrapper">
        <!-- This is the main flex container -->
        <!-- Current Session Tile - Always Visible -->
        <div
          v-if="!tagStore.stashedSessionState"
          key="current-session-tile-session"
          class="image-thumbnail-item current-session-tile live-session-active"
          :title="'This is your current session'"
        >
          <i class="current-session-icon pi pi-desktop"/>
          <span>Current Session</span>
        </div>
        <Button
          v-else
          key="current-session-tile-return"
          label="Return to Current Session"
          icon="pi pi-undo"
          severity="primary"
          class="w-full p-button-secondary google-button mt-4"
          @click="handleCurrentSessionClick"
        />

        <!-- Transition group ONLY for actual images -->
        <transition-group
          v-if="props.dreamId"
          name="image-pop"
          tag="div"
          class="images-animation-wrapper"
        >
          <!-- Loading placeholder for image being generated -->
          <div
            v-if="props.isGeneratingImage"
            key="generating-placeholder"
            class="image-thumbnail-item generating-placeholder"
          >
            <div class="generating-content">
              <LoadingSpinner size="sm" stroke-width="4" />
              <span class="text-xs">Generating...</span>
            </div>
          </div>

          <div
            v-for="(image, idx) in images"
            :key="image.id"
            class="image-thumbnail-item"
            :class="{ 'thumbnail-selected': image.id === props.viewingSnapshotId }"
            @click="handleImageClick(image, idx)"
          >
            <img :src="image.imageUrl" :alt="image.promptText || 'Generated Image'" >
            <div class="image-menu-wrapper">
              <ActionMenu
                :items="getMenuItems(image)"
                button-class="image-menu-button"
                button-type="solid"
                @open="() => {}"
              />
            </div>
          </div>
        </transition-group>

        <!-- Conditional Messages with a simple fade transition -->
        <transition name="fade" mode="out-in">
          <div
            v-if="props.dreamId && pending && images.length === 0"
            key="loading-initial"
            class="loading-message central-message"
          >
            <LoadingSpinner size="md" stroke-width="6" />
            <p>Loading images...</p>
          </div>
          <div
            v-else-if="props.dreamId && pending && images.length > 0"
            key="loading-refresh"
            class="loading-message central-message"
          >
            <LoadingSpinner size="md" stroke-width="6" />
            <p>Updating images...</p>
          </div>
          <div
            v-else-if="props.dreamId && error && !pending"
            key="error-msg"
            class="error-message central-message"
          >
            <i class="pi pi-exclamation-triangle"/>
            <p>Could not load images. {{ error.message }}</p>
          </div>
          <div
            v-else-if="props.dreamId && images.length === 0 && !pending && !error && !props.isGeneratingImage"
            key="empty-dream-msg"
            class="empty-strip-message central-message"
          >
            <p>No images have been generated for this dream yet.</p>
          </div>
          <div
            v-else-if="!props.dreamId && !tagStore.stashedSessionState && !pending"
            key="no-dream-msg"
            class="empty-strip-message central-message full-width-message"
          >
            <p>No Dream loaded. Save your session as a Dream to build an image history.</p>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue' // For loading state
import ActionMenu from './ActionMenu.vue'
import { useTagStore } from '~/store/tagStore' // Import the tag store

const tagStore = useTagStore() // Initialize the store

interface DreamImage {
  id: number
  imageUrl: string
  promptText?: string
  createdAt: string // Assuming Prisma returns date as string (matches ReturnedDreamImage)
  dreamId: number
  graphState?: any // This might not be directly returned by saveGeneratedImage, ensure compatibility
  // Ensure this interface is compatible with what generateImageAndSave will return
}

const props = defineProps<{
  dreamId: number | null
  viewingSnapshotId?: number | null // New prop for selected image ID
  isGeneratingImage?: boolean // New prop for generating image
}>()
const emit = defineEmits(['image-clicked', 'snapshot-requested'])

const images = ref<DreamImage[]>([])
const pending = ref(false)
const error = ref<Error | null>(null)
const lastPrependedImageId = ref<number | null>(null) // Added for tracking

let fetchController: AbortController | null = null

const fetchImages = async (idToFetch: number | null) => {
  // Cancel any ongoing fetch
  if (fetchController) {
    fetchController.abort()
  }
  fetchController = new AbortController()
  const signal = fetchController.signal

  if (typeof idToFetch !== 'number' || idToFetch <= 0) {
    images.value = []
    pending.value = false
    error.value = null
    return
  }

  pending.value = true
  error.value = null
  // Do NOT clear images.value here immediately.

  try {
    const fetchedImages = await $fetch<DreamImage[]>(`/api/images?dreamId=${idToFetch}`, { signal })
    if (signal.aborted) return
    // Only update if the dreamId for this fetch is still the current one
    if (props.dreamId === idToFetch) {
      images.value = fetchedImages
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Image fetch aborted for dreamId:', idToFetch)
      // If this aborted fetch was for the current dreamId, pending should reflect that.
      if (props.dreamId === idToFetch) pending.value = false
      return
    }
    console.error('Failed to fetch images for dream strip:', err)
    if (props.dreamId === idToFetch) {
      error.value = err.data || new Error('Failed to load images')
      images.value = []
    }
  } finally {
    // Only set pending to false if this fetch was for the *current* dreamId
    if (props.dreamId === idToFetch && !signal.aborted) {
      pending.value = false
    }
  }
}

// Expose a method to refetch images
const refetchImages = () => {
  fetchImages(props.dreamId)
}

// New method to prepend an image to the list
const prependImage = (newImage: DreamImage) => {
  if (newImage && newImage.id) {
    // Check if image already exists to prevent duplicates if race conditions occur
    if (!images.value.some((img) => img.id === newImage.id)) {
      images.value.unshift(newImage) // Add to the beginning of the array
      lastPrependedImageId.value = newImage.id // Set the flag
    } else {
      console.warn('[ImageStrip] Attempted to prepend an image that already exists:', newImage.id)
    }
  } else {
    console.warn('[ImageStrip] Attempted to prepend invalid image data:', newImage)
  }
}

defineExpose({
  refetchImages,
  prependImage, // Expose the new method
  images,
})

// Watch for changes to dreamId and fetch accordingly
watch(
  () => props.dreamId,
  (newDreamId, oldDreamId) => {
    if (newDreamId === oldDreamId) return

    if (typeof newDreamId === 'number' && newDreamId > 0) {
      // A new, valid dream has been loaded.
      fetchImages(newDreamId)
    } else {
      // DreamId is null (e.g., new session), so clear the images.
      images.value = []
      pending.value = false
      error.value = null
    }
  },
  { immediate: true }
)

// Watch for stashed state changes to potentially re-evaluate visibility or fetch
watch(
  () => tagStore.stashedSessionState,
  (isStashed) => {
    // If a session becomes stashed and there's no current dreamId,
    // we might want to ensure the strip is visible for the "Current Session" tile.
    // fetchImages will handle clearing images if dreamId is null.
    // No specific action needed here beyond the conditional rendering in template.
    // If dreamId is null and a session is stashed, the strip should show for the "Current Session" tile.
    if (isStashed && !props.dreamId) {
      images.value = [] // Ensure no old images show if dreamId is null
    }
  }
)

const handleImageClick = (image: DreamImage, index: number) => {
  emit('image-clicked', { image, index })
}

const getMenuItems = (image: DreamImage) => [
  {
    label: 'View Snapshot',
    icon: 'pi pi-eye',
    command: () => emit('snapshot-requested', image),
  },
]

const handleCurrentSessionClick = () => {
  if (tagStore.stashedSessionState) {
    // Only restore if a session IS stashed
    tagStore.restoreStashedSession()
  }
  // If !tagStore.stashedSessionState, do nothing as we are already in current session
}
</script>

<style scoped lang="scss">
.image-scroll-area {
  display: flex;
  flex-direction: column; /* Change to vertical */
  overflow-y: auto; /* Change to vertical scroll */
  overflow-x: hidden; /* Hide horizontal overflow */
  padding-right: 10px; /* Add right padding for scrollbar */
  gap: 10px;
  min-height: 120px;
  max-height: calc(100vh - 200px); /* Limit height for vertical scrolling */
}

.images-wrapper {
  display: flex;
  flex-direction: column; /* Change to vertical */
  gap: 10px;
}

.image-thumbnail-item {
  position: relative;
  flex-shrink: 0;
  width: 100%; /* Take full width of container */
  /* Remove fixed height to respect aspect ratio */
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  background-color: rgba(0, 0, 0, 0.2); /* Placeholder bg */
}

.image-thumbnail-item.thumbnail-selected {
  border-color: var(--primary-color, #007bff); /* Use theme primary color or a default blue */
  box-shadow: 0 0 8px var(--primary-color, #007bff);
}

.image-thumbnail-item:hover {
  border-color: var(--primary-color);
}

.image-thumbnail-item img {
  width: 100%;
  height: auto; /* Let height adjust to maintain aspect ratio */
  object-fit: contain; /* Maintain aspect ratio without cropping */
  display: block; /* Remove any inline spacing */
}

.empty-strip-message,
.loading-message,
.error-message {
  display: flex;
  flex-direction: column; /* For loading message */
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100px; /* Ensure it takes up space */
  color: var(--text-color-secondary);
  font-style: italic;
}

.loading-message p {
  margin-top: 0.5rem;
}

.error-message i {
  font-size: 1.5rem;
  color: var(--red-500); /* Or your theme's error color */
  margin-bottom: 0.5rem;
}

/* Custom Scrollbar for Webkit browsers - vertical */
.image-scroll-area::-webkit-scrollbar {
  width: 8px; /* Change from height to width */
}

.image-scroll-area::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}

.image-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.25);
  border-radius: 10px;
}

.image-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}

.current-session-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-b);
  border: 2px solid var(--surface-d); /* Default border */
  color: var(--text-color-secondary);
  text-align: center;
  padding: 10px;
  box-sizing: border-box;
  transition: background-color 0.2s ease, border-color 0.2s ease;
  height: 80px; /* Slightly smaller height for vertical layout */
}

.current-session-tile.clickable-to-return {
  cursor: pointer;
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.current-session-tile.clickable-to-return:hover {
  background-color: var(--surface-c);
  border-color: var(--primary-emphasis);
}

.current-session-tile.live-session-active {
  border-color: var(--green-500); /* Highlight color for active live session */
  color: var(--green-400);
  background-color: var(--surface-a); /* Slightly different bg for active */
  cursor: default; /* Non-interactive when live */
}

.current-session-icon {
  font-size: 1.5rem; /* Slightly smaller for vertical layout */
  margin-bottom: 0.25rem;
}

.current-session-tile span {
  font-size: 0.65rem; /* Slightly smaller text */
  font-weight: bold;
}

/* Styles for messages when they appear in vertical layout */
.central-message {
  /* Full width in vertical layout */
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.full-width-message {
  width: 100%; /* Full width in vertical layout */
}

.image-strip-container {
  min-height: 170px; /* Ensure adequate height for title + content */
}

/* Image Pop Animation - adjusted for vertical */
.image-pop-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px); /* Come from top in vertical layout */
}
.image-pop-enter-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1); /* Smoother ease-out-back like */
}
.image-pop-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* For <transition-group>, -move class is important for smooth reordering */
.image-pop-move {
  transition: transform 0.5s ease;
}

/* Ensure individual items are not affecting layout during transition if needed */
.image-pop-leave-active {
  /* Example: if you implement removals later and want them to shrink/fade out */
  /* position: absolute; */ /* Be cautious with absolute positioning in flex layouts */
  transition: all 0.3s ease;
}
.image-pop-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

/* Fade Transition for messages */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.images-animation-wrapper {
  display: contents;
}

/* Generating placeholder styles */
.generating-placeholder {
  border: 2px dashed var(--primary-color) !important;
  background-color: rgba(var(--primary-color-rgb, 0, 123, 255), 0.1) !important;
  cursor: default;
  min-height: 80px;
}

.generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--primary-color);
}

.generating-content span {
  font-weight: 500;
  opacity: 0.8;
}

.image-menu-wrapper {
  position: absolute;
  top: 4px;
  right: 4px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}

.image-thumbnail-item:hover .image-menu-wrapper {
  opacity: 1;
  visibility: visible;
}

.image-menu-button {
  width: 1.5rem;
  height: 1.5rem;
  background-color: var(--surface-b);
  border-radius: 4px;
  padding: 4px;
  border: 1px solid var(--surface-d);
}
</style>
