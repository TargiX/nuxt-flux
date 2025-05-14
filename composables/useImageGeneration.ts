import { ref } from 'vue';
import { useTagStore } from '~/store/tagStore';
import { useToast } from 'primevue/usetoast';
import { generateImageFromPrompt } from '~/services/imageGenerationService';
import { saveGeneratedImage, type GeneratedImageData } from '~/services/imageService';
import type { Tag } from '~/types/tag';

// It would be best if DreamImage type is defined in a shared types file
// For now, let's define a compatible structure here or assume GeneratedImageData is close enough
// If GeneratedImage from Prisma has id, createdAt, etc., we need that structure.
// Let's assume the server returns an object that includes at least id, imageUrl, promptText, createdAt.
interface ReturnedDreamImage {
  id: number;
  imageUrl: string;
  promptText?: string;
  createdAt: string; // Or Date
  // Potentially other fields like graphState might be returned by the API.
}

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
  ): Promise<ReturnedDreamImage | null> { // Modified return type
    if (!promptText) {
      console.error('No prompt text available for image generation.');
      toast.add({
        severity: 'warn',
        summary: 'Missing Prompt',
        detail: 'Cannot generate image without a prompt text.',
        life: 3000,
      });
      return null;
    }

    if (isGeneratingImage.value || isImageCooldown.value) {
      return null;
    }

    isGeneratingImage.value = true;
    tagStore.setCurrentImageUrl(null); // Clear previous image
    const localRequestId = ++imageRequestId;
    let newImageFromDb: ReturnedDreamImage | null = null;

    try {
      const imageUrl = await generateImageFromPrompt(promptText);

      if (localRequestId === imageRequestId) { // Check if this is the latest request
        tagStore.setCurrentImageUrl(imageUrl);

        if (currentDreamId && imageUrl) {
          try {
            const imagePayload: GeneratedImageData = {
              imageUrl,
              promptText,
              dreamId: currentDreamId,
              graphState: {
                focusedZone: focusedZoneValue,
                tags: JSON.parse(JSON.stringify(currentTags)), // Deep clone for safety
              },
            };
            // saveGeneratedImage should return the created image object from the DB
            const savedImage = await saveGeneratedImage(imagePayload) as ReturnedDreamImage; 
            
            if (savedImage && savedImage.id) { // Check if image was actually saved and has an ID
              newImageFromDb = savedImage;
              // Toast for successful save can be shown in TagCloud or here if preferred
              // toast.add({
              //   severity: 'info',
              //   summary: 'Image Saved',
              //   detail: 'Generated image progress saved to your dream history.',
              //   life: 3000,
              // });
            } else {
              throw new Error('Saved image data is invalid or missing ID.');
            }

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
          // This toast is still relevant if not saving to a dream
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
    return newImageFromDb; // Return the new image object or null
  }

  return {
    isGeneratingImage,
    isImageCooldown,
    generateImageAndSave,
  };
} 