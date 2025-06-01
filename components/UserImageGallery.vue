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
      <div v-for="image in images" :key="image.id" class="image-card glass-card-hoverable">
        <img :src="image.imageUrl" :alt="image.promptText || 'User generated image'" class="gallery-image" />
        <div class="image-info p-3">
          <p v-if="image.promptText" class="prompt-text text-xs truncate" :title="image.promptText">
            {{ image.promptText }}
          </p>
          <p class="date-text text-xs text-gray-400 mt-1">
            {{ new Date(image.createdAt).toLocaleDateString() }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface GalleryImage {
  id: number;
  imageUrl: string;
  promptText?: string | null;
  createdAt: string; // Or Date, adjust based on API response
  // Add other fields if needed from the API response, e.g., graphState
}

const images = ref<GalleryImage[]>([]);
const pending = ref(true);
const error = ref<any | null>(null); // Using any for error to accommodate potential error structures

async function fetchUserImages() {
  pending.value = true;
  error.value = null;
  try {
    // The $fetch utility is auto-imported in Nuxt 3
    const fetchedImages = await $fetch<GalleryImage[]>('/api/images/user');
    images.value = fetchedImages;
  } catch (err: any) {
    console.error('Failed to fetch user images for gallery:', err);
    error.value = err; // Store the whole error object for more details if needed
  } finally {
    pending.value = false;
  }
}

onMounted(() => {
  fetchUserImages();
});

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
  /* glass-card-hoverable will provide base styling, add specifics here if needed */
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.image-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.2); /* Enhanced shadow on hover */
}

.gallery-image {
  width: 100%;
  height: 200px; /* Fixed height for uniform card size */
  object-fit: cover; /* Cover ensures the image fills the space, might crop */
  display: block;
}

.image-info {
  background-color: rgba(0,0,0,0.1); /* Subtle bg for info section */
}

.prompt-text {
  /* Ensures long prompts don't break layout */
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

/* Re-using glass-card styles from a more global scope is assumed.
   If glass-card-hoverable is not defined globally, define it or similar here.
   Example for glass-card-hoverable if not global:
*/
.glass-card-hoverable {
  background: rgba(255, 255, 255, 0.05); /* More subtle for gallery items */
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text-color);
}
</style> 