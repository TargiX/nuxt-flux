<template>
  <div class="gallery-page-container p-4">
    <h1 class="text-3xl font-bold mb-6 text-center">My Image Gallery</h1>
    <UserImageGallery />
  </div>
</template>

<script setup lang="ts">
import UserImageGallery from '~/components/UserImageGallery.vue';

// Add any page-specific logic or metadata here if needed in the future
useHead({
  title: 'My Image Gallery',
});
</script>

<style scoped>
.gallery-page-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style> 