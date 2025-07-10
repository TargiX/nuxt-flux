<template>
  <div v-if="isPageLoading" class="page-loading-container">
    <ProgressSpinner stroke-width="8" fill="var(--surface-ground)" animation-duration=".5s" />
    <p>Loading session...</p>
  </div>
  <div v-else>
    <div class="mx-auto max-w-[96vw]">
      <TagCloud />
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

  // If the route's ID already matches the store's ID, the state is current.
  if (idNum === tagStore.loadedDreamId) {
    isPageLoading.value = false // Ensure loading screen is off
    return
  }

  isPageLoading.value = true
  try {
    const dreamData = await $fetch<DreamData>(`/api/dreams/${idNum}`)
    await tagStore.loadDreamState(dreamData, idNum)
  } catch (e) {
    console.error(`[initializeSession] Failed to load dream ${idNum}:`, e)
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
.page-loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100px);
  width: 100%;
}
</style>
