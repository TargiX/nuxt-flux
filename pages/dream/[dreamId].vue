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
  console.log(`[initializeSession] Route param dreamId: ${dreamIdParam}`);
  isPageLoading.value = true;

  if (dreamIdParam === 'new') {
    console.log('[initializeSession] Handling new dream session.');
    await tagStore.resetToCurrentSession({ isNewDream: true });
    isPageLoading.value = false;
    return;
  }

  const idNum = parseInt(dreamIdParam, 10);
  if (!isNaN(idNum)) {
    console.log(`[initializeSession] Loading existing dream with ID: ${idNum}`);
    try {
      const dreamData = await $fetch<DreamData>(`/api/dreams/${idNum}`);
      await tagStore.loadDreamState(dreamData, idNum);
    } catch (e) {
      console.error(`[initializeSession] Failed to load dream ${idNum}:`, e);
      router.replace('/dream/new');
    }
  } else {
    console.warn(`[initializeSession] Invalid dream ID param: ${dreamIdParam}. Redirecting to new dream.`);
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