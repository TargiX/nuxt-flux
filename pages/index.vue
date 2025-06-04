<template>
    <div class="mx-auto max-w-[96vw]">
      <TagCloud />
    </div>
  </template>
  
  <script setup lang="ts">
  import TagCloud from '~/components/TagCloud.vue'
  import { useRouter } from 'vue-router';

  const router = useRouter();
  // Redirect to new dream session
  router.replace('/dream/new');
  </script>