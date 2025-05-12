<template>
  <div class="image-strip-container glass-card" v-if="props.dreamId">
    <h2 class="strip-title">Dream Image History</h2>
    <div v-if="pending" class="loading-message">
      <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="6" />
      <p>Loading images...</p>
    </div>
    <div v-else-if="error" class="error-message">
      <i class="pi pi-exclamation-triangle"></i>
      <p>Could not load images. {{ error.message }}</p>
    </div>
    <div v-else-if="images && images.length === 0" class="empty-strip-message">
      <p>No images have been generated for this dream yet.</p>
    </div>
    <div v-else class="image-scroll-area">
      <div class="images-wrapper">
        <div v-for="image in images" :key="image.id" class="image-thumbnail-item" @click="selectImage(image)">
          <img :src="image.imageUrl" :alt="image.promptText || 'Generated Image'" />
        </div>
      </div>
    </div>
  </div>
  <div v-else class="image-strip-container glass-card">
    <h2 class="strip-title">Dream Image History</h2>
    <div class="empty-strip-message">
      <p>Save your session as a Dream to see image history.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import ProgressSpinner from 'primevue/progressspinner'; // For loading state

interface DreamImage {
  id: number;
  imageUrl: string;
  promptText?: string;
  createdAt: string; // Assuming Prisma returns date as string
  graphState?: any; // Add graphState, make it optional for now
}

const props = defineProps<{ dreamId: number | null }>();
const emit = defineEmits(['image-selected']);

const images = ref<DreamImage[]>([]);
const pending = ref(false);
const error = ref<Error | null>(null);

const fetchImages = async (currentDreamId: number | null) => {
  if (!currentDreamId) {
    images.value = [];
    return;
  }
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
};

// Expose a method to refetch images
const refetchImages = () => {
  fetchImages(props.dreamId);
};

defineExpose({
  refetchImages,
});

watch(() => props.dreamId, (newDreamId) => {
  fetchImages(newDreamId);
}, { immediate: true });

const selectImage = (image: DreamImage) => {
  emit('image-selected', image);
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
</style> 