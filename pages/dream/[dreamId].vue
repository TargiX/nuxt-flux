<template>
  <div class="dream-page-container">
    <div class="mx-auto max-w-[96vw]">
      <TagCloud />
    </div>
    <!-- Loading overlay that doesn't destroy the TagCloud component -->
    <div v-if="isPageLoading" class="page-loading-overlay">
      <ProgressSpinner stroke-width="8" fill="var(--surface-ground)" animation-duration=".5s" />
      <p>Loading session...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TagCloud from '~/components/TagCloud.vue'
import { useTagStore } from '~/store/tagStore'
import type { Tag } from '~/types/tag'
import type { ViewportState } from '~/composables/useZoom'

// Interface matching the server response for dream data
interface DreamData {
  focusedZone: string
  tags: Tag[]
  generatedPrompt?: string
  imageUrl?: string | null
  zoneViewports?: Record<string, ViewportState>
}

definePageMeta({ title: 'Dream Session' })

const route = useRoute()
const router = useRouter()
const tagStore = useTagStore()
const isPageLoading = ref(false)

async function initializeSession() {
  const dreamIdParam = route.params.dreamId as string

  // Handle a new dream session first.
  if (dreamIdParam === 'new') {
    // If the store already thinks we are in a 'new' session, do nothing.
    if (tagStore.loadedDreamId === null) {
      isPageLoading.value = false
      return
    }
    isPageLoading.value = true
    await tagStore.resetToCurrentSession({ isNewDream: true })
    isPageLoading.value = false
    return
  }

  // From here, we are dealing with a numerical ID.
  const idNum = parseInt(dreamIdParam, 10)
  if (isNaN(idNum)) {
    router.replace('/dream/new')
    return
  }

  // Always load dream data to ensure viewport coordinates are properly restored
  // Even if the dream ID matches, we need to fetch and apply the saved state
  isPageLoading.value = true
  try {
    const dreamData = await $fetch<DreamData>(`/api/dreams/${idNum}`)
    await tagStore.loadDreamState(dreamData, idNum)
  } catch (e) {
    console.error(`Failed to load dream ${idNum}:`, e)
    router.replace('/dream/new')
  } finally {
    isPageLoading.value = false
  }
}

onMounted(() => initializeSession())
watch(
  () => route.params.dreamId,
  () => initializeSession()
)
</script>

<style scoped>
.dream-page-container {
  position: relative;
  min-height: calc(100vh - 100px);
}

.page-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(var(--surface-ground-rgb), 0.9);
  backdrop-filter: blur(4px);
  z-index: 1000;
}
</style>
