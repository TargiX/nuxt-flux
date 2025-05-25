<template>
  <div class="image-strip-container glass-card">
    <h2 class="strip-title">
      <span v-if="!tagStore.stashedSessionState">Current Session</span>
      <span v-else>Viewing Snapshot</span>
    </h2>
    
    <div class="image-scroll-area">
      <transition-group name="image-pop" tag="div" class="images-wrapper">
        <!-- Current Session Tile - Always Visible -->
        <div
          key="current-session"
          class="image-thumbnail-item current-session-tile"
          :class="{
            'live-session-active': !tagStore.stashedSessionState,
            'clickable-to-return': tagStore.stashedSessionState
          }"
          @click="handleCurrentSessionClick"
          :title="!tagStore.stashedSessionState ? 'This is your current session' : 'Return to your current session'"
        >
          <i :class="['current-session-icon', !tagStore.stashedSessionState ? 'pi pi-desktop' : 'pi pi-undo']"></i>
          <span>{{ !tagStore.stashedSessionState ? 'Current Session' : 'Return to Current Session' }}</span>
        </div>

        <!-- Dream Specific Images -->
        <template v-if="props.dreamId">
          <div v-if="pending" key="loading-msg" class="loading-message central-message">
            <LoadingSpinner size="md" strokeWidth="6" />
            <p>Loading images...</p>
          </div>
          <div v-else-if="error" key="error-msg" class="error-message central-message">
            <i class="pi pi-exclamation-triangle"></i>
            <p>Could not load images. {{ error.message }}</p>
          </div>
          <div v-else-if="images && images.length === 0" key="empty-dream-msg" class="empty-strip-message central-message">
            <p>No images have been generated for this dream yet.</p>
          </div>
          <div
            v-for="image in images"
            :key="image.id"
            class="image-thumbnail-item"
            :class="{ 'thumbnail-selected': image.id === props.viewingSnapshotId }"
            @click="selectImage(image)"
          >
            <img :src="image.imageUrl" :alt="image.promptText || 'Generated Image'" />
          </div>
        </template>
        <div v-else-if="!props.dreamId && !tagStore.stashedSessionState" key="no-dream-msg" class="empty-strip-message central-message full-width-message">
            <p>No Dream loaded. Save your session as a Dream to build an image history.</p>
        </div>

      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue'; // For loading state
import { useTagStore } from '~/store/tagStore'; // Import the tag store

const tagStore = useTagStore(); // Initialize the store

interface DreamImage {
  id: number;
  imageUrl: string;
  promptText?: string;
  createdAt: string; // Assuming Prisma returns date as string (matches ReturnedDreamImage)
  graphState?: any; // This might not be directly returned by saveGeneratedImage, ensure compatibility
  // Ensure this interface is compatible with what generateImageAndSave will return
}

const props = defineProps<{
  dreamId: number | null;
  viewingSnapshotId?: number | null; // New prop for selected image ID
}>();
const emit = defineEmits(['image-selected']);

const images = ref<DreamImage[]>([]);
const pending = ref(false);
const error = ref<Error | null>(null);

const fetchImages = async (currentDreamId: number | null) => {
  if (!currentDreamId) {
    images.value = []; // Clear images if no dreamId
    // Do not return early, as the component itself might still be visible for the "Current Session" tile.
    return; 
  }
  // Only set pending if we are actually fetching for a dreamId
  if (currentDreamId) {
    pending.value = true;
    error.value = null;
    try {
      const fetchedImages = await $fetch<DreamImage[]>('/api/images?dreamId=' + currentDreamId);
      images.value = fetchedImages;
    } catch (err: any) {
      console.error('Failed to fetch images for dream strip:', err);
      error.value = err.data || new Error('Failed to load images');
      images.value = []; // Clear images on error
    } finally {
      pending.value = false;
    }
  } else {
    images.value = []; // Ensure images are cleared if dreamId becomes null
  }
};

// Expose a method to refetch images
const refetchImages = () => {
  fetchImages(props.dreamId);
};

// New method to prepend an image to the list
const prependImage = (newImage: DreamImage) => {
  if (newImage && newImage.id) {
    images.value.unshift(newImage); // Add to the beginning of the array
  } else {
    console.warn('[ImageStrip] Attempted to prepend invalid image data:', newImage);
  }
};

defineExpose({
  refetchImages,
  prependImage, // Expose the new method
});

watch(() => props.dreamId, (newDreamId) => {
  fetchImages(newDreamId);
}, { immediate: true });

// Watch for stashed state changes to potentially re-evaluate visibility or fetch
watch(() => tagStore.stashedSessionState, (isStashed) => {
  // If a session becomes stashed and there's no current dreamId,
  // we might want to ensure the strip is visible for the "Current Session" tile.
  // fetchImages will handle clearing images if dreamId is null.
  // No specific action needed here beyond the conditional rendering in template.
  // If dreamId is null and a session is stashed, the strip should show for the "Current Session" tile.
  if (isStashed && !props.dreamId) {
    images.value = []; // Ensure no old images show if dreamId is null
  }
});

const selectImage = (image: DreamImage) => {
  emit('image-selected', image);
};

const handleCurrentSessionClick = () => {
  if (tagStore.stashedSessionState) { // Only restore if a session IS stashed
    tagStore.restoreStashedSession();
  }
  // If !tagStore.stashedSessionState, do nothing as we are already in current session
};
</script>

<style scoped>
.image-scroll-area {
  display: flex;
  overflow-x: auto;
  padding-bottom: 10px;
  gap: 10px;
  min-height: 120px;
}

.images-wrapper {
  display: flex;
  gap: 10px;
}

.image-thumbnail-item {
  flex-shrink: 0;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
  background-color: rgba(0,0,0,0.2); /* Placeholder bg */
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
  height: 100%;
  object-fit: cover;
}

.empty-strip-message, .loading-message, .error-message {
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

/* Custom Scrollbar for Webkit browsers */
.image-scroll-area::-webkit-scrollbar {
  height: 8px;
}

.image-scroll-area::-webkit-scrollbar-track {
  background: rgba(0,0,0,0.1);
  border-radius: 10px;
}

.image-scroll-area::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
}

.image-scroll-area::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.4);
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
  font-size: 2rem; 
  margin-bottom: 0.5rem;
}

.current-session-tile span {
  font-size: 0.7rem;
  font-weight: bold;
}

/* Styles for messages when they appear next to the current session tile */
.central-message {
  /* To make these messages take up available space if they are the only thing besides the current session tile */
  flex-grow: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.full-width-message {
   width: calc(100% - 130px); /* Assuming current session tile + gap is around 130px */
}

.image-strip-container {
  min-height: 170px; /* Ensure adequate height for title + content */
}

/* Image Pop Animation */
.image-pop-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
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
</style> 