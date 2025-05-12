import { ref } from 'vue';
import { useTagStore } from '~/store/tagStore';
import { useToast } from 'primevue/usetoast';
import { generateImageFromPrompt } from '~/services/imageGenerationService';
import { saveGeneratedImage } from '~/services/imageService';
import type { Tag } from '~/types/tag';

export function useImageGeneration() {
  const tagStore = useTagStore();
  const toast = useToast();

  const isGeneratingImage = ref(false);
  const isImageCooldown = ref(false);
  let imageRequestId = 0; // Internal request ID to handle concurrent requests

  async function generateImageAndSave(
    promptText: string, 
    currentDreamId: number | null,
    focusedZoneValue: string, // Pass as value
    currentTags: Tag[]       // Pass as value
  ): Promise<boolean> { // Returns true if image strip should be refreshed
    if (!promptText) {
      console.error('No prompt text available for image generation.');
      toast.add({
        severity: 'warn',
        summary: 'Missing Prompt',
        detail: 'Cannot generate image without a prompt text.',
        life: 3000,
      });
      return false;
    }

    if (isGeneratingImage.value || isImageCooldown.value) {
      return false;
    }

    isGeneratingImage.value = true;
    tagStore.setCurrentImageUrl(null); // Clear previous image
    const localRequestId = ++imageRequestId;
    let imageSavedToDream = false;

    try {
      const imageUrl = await generateImageFromPrompt(promptText);

      if (localRequestId === imageRequestId) { // Check if this is the latest request
        tagStore.setCurrentImageUrl(imageUrl);

        if (currentDreamId && imageUrl) {
          try {
            const currentGraphState = {
              focusedZone: focusedZoneValue,
              tags: JSON.parse(JSON.stringify(currentTags)), // Deep clone for safety
            };

            await saveGeneratedImage({
              imageUrl,
              promptText,
              dreamId: currentDreamId,
              graphState: currentGraphState,
            });
            toast.add({
              severity: 'info',
              summary: 'Image Saved',
              detail: 'Generated image progress saved to your dream history.',
              life: 3000,
            });
            imageSavedToDream = true;
          } catch (saveError: any) {
            console.error('Failed to save generated image to DB:', saveError);
            toast.add({
              severity: 'error',
              summary: 'Image Save Failed',
              detail: saveError.message || 'Could not save image progress to dream history.',
              life: 5000,
            });
          }
        } else if (!currentDreamId && imageUrl) {
          toast.add({
            severity: 'warn',
            summary: 'Image Not Saved to Dream',
            detail: 'Save your current session as a Dream to keep this image in its history.',
            life: 5000,
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      if (localRequestId === imageRequestId) {
        tagStore.setCurrentImageUrl(null); // Clear image on error
        toast.add({
          severity: 'error',
          summary: 'Image Generation Failed',
          detail: error.message || 'Could not generate image. Please try again.',
          life: 5000,
        });
      }
    } finally {
      if (localRequestId === imageRequestId) {
        isGeneratingImage.value = false;
        isImageCooldown.value = true;
        setTimeout(() => {
          isImageCooldown.value = false;
        }, 1500); // Cooldown period
      }
    }
    return imageSavedToDream;
  }

  return {
    isGeneratingImage,
    isImageCooldown,
    generateImageAndSave,
  };
} 