<template>
  <div class="mx-auto max-w-[96vw]">
    <TagCloud />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import TagCloud from '~/components/TagCloud.vue';
import { useTagStore } from '~/store/tagStore';
import type { Tag } from '~/types/tag';
import type { ViewportState } from '~/composables/useZoom';

definePageMeta({ title: 'Dream Session' });

const route = useRoute();
const router = useRouter();
const tagStore = useTagStore();

// Interface matching the server response for dream data
interface DreamData {
  focusedZone: string;
  tags: Tag[];
  generatedPrompt?: string;
  imageUrl?: string | null;
  zoneViewports?: Record<string, ViewportState>;
}

async function initializeSession() {
  const dreamIdParam = route.params.dreamId as string;
  if (dreamIdParam === 'new') {
    tagStore.resetToCurrentSession({ isNewDream: true });
    return;
  }
  const idNum = parseInt(dreamIdParam, 10);
  if (!isNaN(idNum)) {
    try {
      const dreamData = await $fetch<DreamData>(`/api/dreams/${idNum}`);
      tagStore.loadDreamState(dreamData, idNum);
    } catch {
      router.replace('/dream/new');
    }
  } else {
    router.replace('/dream/new');
  }
}

onMounted(() => initializeSession());
watch(() => route.params.dreamId, () => initializeSession());
</script> 