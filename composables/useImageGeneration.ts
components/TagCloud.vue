import { useTagStore } from '~/store/tagStore';

interface ReturnedDreamImage {
  id: number;
  imageUrl: string;
  promptText: string;
  createdAt: string;
  dreamId: number;
  graphState: any;
}

// Reusable composable for generating and saving images
export function useImageGeneration() {
  // ... existing code ...
}

function loadPendingSnapshot() {
  const pendingSnap = tagStore.consumePendingSnapshot();
  if (pendingSnap) {
    const snapshotPayload = {
      ...pendingSnap,
      promptText: pendingSnap.promptText ?? undefined,
    };
    tagStore.loadStateFromImageSnapshot(snapshotPayload);
    tagStore.viewingSnapshotImageId = pendingSnap.id;
  }
}

onMounted(() => {
  // ... existing code ...
} 