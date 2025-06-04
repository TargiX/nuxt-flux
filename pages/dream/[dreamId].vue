<template>
  <div v-if="isPageLoading" class="page-loading-container">
    <ProgressSpinner strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
    <p>Loading session...</p>
  </div>
  <div v-else>
    <div class="mx-auto max-w-[96vw]">
      <TagCloud />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TagCloud from '~/components/TagCloud.vue';
import { useTagStore } from '~/store/tagStore';
import type { Tag } from '~/types/tag';
import type { ViewportState } from '~/composables/useZoom';

// Interface matching the server response for dream data
interface DreamData {
  focusedZone: string;
  tags: Tag[];
  generatedPrompt?: string;
  imageUrl?: string | null;
  zoneViewports?: Record<string, ViewportState>;
}

definePageMeta({ title: 'Dream Session' });

const route = useRoute();
const router = useRouter();
const tagStore = useTagStore();
const isPageLoading = ref(false);

async function initializeSession() {
  const dreamIdParam = route.params.dreamId as string;
  isPageLoading.value = true;

  if (dreamIdParam === 'new') {
    tagStore.resetToCurrentSession({ isNewDream: true });
    // Wait for store to finish applying reset
    await nextTick();
    isPageLoading.value = false;
    return;
  }

  const idNum = parseInt(dreamIdParam, 10);
  if (!isNaN(idNum)) {
    try {
      const dreamData = await $fetch<DreamData>(`/api/dreams/${idNum}`);
      tagStore.loadDreamState(dreamData, idNum);
      // Wait for store to apply loaded state
      await nextTick();
    } catch {
      router.replace('/dream/new');
    }
  } else {
    router.replace('/dream/new');
  }

  isPageLoading.value = false;
}

onMounted(() => initializeSession());
watch(() => route.params.dreamId, () => initializeSession());
</script>

<style scoped>
.page-loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
  width: 100%;
}
</style> 