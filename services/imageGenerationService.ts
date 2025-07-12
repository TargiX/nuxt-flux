// Removed SDK imports: import { GoogleGenerativeAI } from '@google/generative-ai';
// Removed config import: import { useRuntimeConfig } from '#app';

// Keep these simple interfaces if needed for type safety in the service,
// although the detailed ones are now in the API route.
interface ImageApiResponse {
  imageBase64: string
}

/**
 * Generates an image based on the provided prompt using the backend API proxy.
 *
 * @param promptText - The text prompt to use for image generation.
 * @param modelId - The ID of the model to use for generation (optional, defaults to gemini-flash).
 * @returns A base64 encoded image string (e.g., "data:image/png;base64,...") or null if generation fails.
 * @throws Throws an error if the API call fails.
 */
export async function generateImageFromPrompt(
  promptText: string,
  modelId: string = 'gemini-flash',
  selectedTagsData: Array<{ alias: string; text: string }> = []
): Promise<string | null> {
  if (!promptText || promptText.trim().length === 0) {
    console.warn('generateImageFromPrompt called with empty prompt.')
    return null
  }

  try {
    console.log('Calling /api/generate-image with prompt:', promptText, 'and model:', modelId)

    // Call the universal image generation endpoint
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: promptText,
        modelId: modelId,
        selectedTagsData,
      }),
    })

    if (!response.ok) {
      // Attempt to get a meaningful error message from the response
      let errorBody = await response.text()
      try {
        const parsedError = JSON.parse(errorBody)
        errorBody = parsedError.message || parsedError.statusMessage || errorBody
      } catch {
        /* Ignore parsing error */
      }
      console.error(`Image Generation API Error (${response.status}):`, errorBody)
      throw new Error(`API Error (${response.status}): ${errorBody}`)
    }

    // Expecting { imageBase64: "data:..." } from the API
    const data = (await response.json()) as ImageApiResponse

    if (data && data.imageBase64) {
      return data.imageBase64
    } else {
      console.error(
        'Invalid response format from /api/generate-image. Expected imageBase64 field.',
        data
      )
      return null // Or throw an error
    }
  } catch (error) {
    console.error('Error calling image generation API:', error)
    // Re-throw the error to be handled by the calling component (e.g., TagCloud.vue)
    throw error
  }
}
