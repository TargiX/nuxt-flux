import { ref } from 'vue'
import { useTagStore } from '~/store/tagStore'
import { useToast } from 'primevue/usetoast'
import { generateImageFromPrompt } from '~/services/imageGenerationService'
import { saveGeneratedImage, type GeneratedImageData } from '~/services/imageService'
import type { Tag } from '~/types/tag'
import { useErrorTracking } from '~/composables/useErrorTracking'

// It would be best if DreamImage type is defined in a shared types file
// For now, let's define a compatible structure here or assume GeneratedImageData is close enough
// If GeneratedImage from Prisma has id, createdAt, etc., we need that structure.
// Let's assume the server returns an object that includes at least id, imageUrl, promptText, createdAt.
interface ReturnedDreamImage {
  id: number
  imageUrl: string
  promptText: string
  createdAt: string
  dreamId: number
  graphState: any
}

export function useImageGeneration() {
  const tagStore = useTagStore()
  const toast = useToast()
  const { trackError, trackUserAction, trackPerformance } = useErrorTracking()

  const isGeneratingImage = ref(false)
  const isImageCooldown = ref(false)
  let imageRequestId = 0 // Internal request ID to handle concurrent requests

  async function generateImageAndSave(
    promptText: string,
    currentDreamId: number | null,
    focusedZoneValue: string, // Pass as value
    currentTags: Tag[] // Pass as value
  ): Promise<ReturnedDreamImage | null> {
    // Modified return type
    if (!promptText) {
      trackError(
        'No prompt text for image generation',
        'Cannot generate image without a prompt text.',
        {
          showToast: true,
          level: 'warning',
          context: {
            imageGeneration: {
              dreamId: currentDreamId,
              focusedZone: focusedZoneValue,
            },
          },
        }
      )
      return null
    }

    if (isGeneratingImage.value || isImageCooldown.value) {
      return null
    }

    // Track user action
    trackUserAction('generate_image_start', 'image', {
      promptLength: promptText.length,
      dreamId: currentDreamId,
      zone: focusedZoneValue,
      tagCount: currentTags.filter((t) => t.selected).length,
    })

    const startTime = Date.now()
    isGeneratingImage.value = true
    tagStore.setCurrentImageUrl(null) // Clear previous image
    const localRequestId = ++imageRequestId
    let newImageFromDb: ReturnedDreamImage | null = null

    try {
      const imageUrl = await generateImageFromPrompt(promptText)
      const generationTime = Date.now() - startTime

      // Track performance
      trackPerformance('image_generation', generationTime, {
        promptLength: promptText.length,
        success: true,
      })

      if (localRequestId === imageRequestId) {
        // Check if this is the latest request
        tagStore.setCurrentImageUrl(imageUrl)

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
            }
            // saveGeneratedImage should return the created image object from the DB
            const savedImage = (await saveGeneratedImage(imagePayload)) as ReturnedDreamImage

            if (savedImage && savedImage.id) {
              // Check if image was actually saved and has an ID
              newImageFromDb = savedImage

              // Track successful save
              trackUserAction('image_saved', 'image', {
                imageId: savedImage.id,
                dreamId: currentDreamId,
              })
            } else {
              throw new Error('Saved image data is invalid or missing ID.')
            }
          } catch (saveError: any) {
            trackError(
              saveError,
              'Could not save image to your dream history. The image was generated but not saved.',
              {
                context: {
                  imageGeneration: {
                    dreamId: currentDreamId,
                    stage: 'saving',
                    error: saveError.message,
                  },
                },
              }
            )
          }
        } else if (!currentDreamId && imageUrl) {
          // This toast is still relevant if not saving to a dream
          toast.add({
            severity: 'warn',
            summary: 'Image Not Saved to Dream',
            detail: 'Save your current session as a Dream to keep this image in its history.',
            life: 5000,
          })
        }
      }
    } catch (error: any) {
      const generationTime = Date.now() - startTime

      // Track performance even for failures
      trackPerformance('image_generation', generationTime, {
        promptLength: promptText.length,
        success: false,
        error: error.message,
      })

      if (localRequestId === imageRequestId) {
        tagStore.setCurrentImageUrl(null) // Clear image on error

        // Determine user-friendly error message
        let userMessage = 'Could not generate image. Please try again.'
        if (error.message?.includes('rate limit')) {
          userMessage = 'Too many requests. Please wait a moment and try again.'
        } else if (error.message?.includes('API key')) {
          userMessage = 'Image generation service is not configured properly.'
        } else if (error.message?.includes('network')) {
          userMessage = 'Network error. Please check your connection and try again.'
        }

        trackError(error, userMessage, {
          context: {
            imageGeneration: {
              promptText: promptText.substring(0, 100), // First 100 chars only
              dreamId: currentDreamId,
              zone: focusedZoneValue,
              stage: 'generation',
            },
          },
        })
      }
    } finally {
      if (localRequestId === imageRequestId) {
        isGeneratingImage.value = false
        isImageCooldown.value = true
        setTimeout(() => {
          isImageCooldown.value = false
        }, 1500) // Cooldown period
      }
    }
    return newImageFromDb // Return the new image object or null
  }

  return {
    isGeneratingImage,
    isImageCooldown,
    generateImageAndSave,
  }
}
