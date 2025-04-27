// Removed SDK imports: import { GoogleGenerativeAI } from '@google/generative-ai';
// Removed config import: import { useRuntimeConfig } from '#app';

/**
 * Represents the structure of an inline image data part from the Gemini API.
 */
interface InlineDataPart {
  mimeType: string;
  data: string;
}

/**
 * Represents the structure of a part within the Gemini API response content.
 */
interface ContentPart {
  text?: string;
  inlineData?: InlineDataPart;
}

/**
 * Represents the structure of a candidate in the Gemini API response.
 */
interface GeminiCandidate {
  content: {
    parts: ContentPart[];
  };
  // Add other candidate properties if needed
}

/**
 * Represents the overall structure of the Gemini API response for image generation.
 */
interface GeminiImageResponse {
  candidates?: GeminiCandidate[];
  // Add other response properties if needed
}

// Keep these simple interfaces if needed for type safety in the service, 
// although the detailed ones are now in the API route.
interface ImageApiResponse {
  imageBase64: string;
}

/**
 * Generates an image based on the provided prompt using the backend API proxy.
 * 
 * @param promptText - The text prompt to use for image generation.
 * @returns A base64 encoded image string (e.g., "data:image/png;base64,...") or null if generation fails.
 * @throws Throws an error if the API call fails.
 */
export async function generateImageFromPrompt(promptText: string): Promise<string | null> {

  if (!promptText || promptText.trim().length === 0) {
    console.warn('generateImageFromPrompt called with empty prompt.');
    return null;
  }

  try {
    console.log('Calling /api/gemini-image with prompt:', promptText);

    // Call the dedicated backend image generation endpoint
    const response = await fetch('/api/gemini-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: promptText }), // Only need to send the prompt
    });

    if (!response.ok) {
      // Attempt to get a meaningful error message from the response
      let errorBody = await response.text();
      try {
        const parsedError = JSON.parse(errorBody);
        errorBody = parsedError.message || parsedError.statusMessage || errorBody;
      } catch(e) { /* Ignore parsing error */ }
      console.error(`Image Generation API Error (${response.status}):`, errorBody);
      throw new Error(`API Error (${response.status}): ${errorBody}`);
    }

    // Expecting { imageBase64: "data:..." } from the API
    const data = await response.json() as ImageApiResponse;

    if (data && data.imageBase64) {
        return data.imageBase64;
    } else {
        console.error('Invalid response format from /api/gemini-image. Expected imageBase64 field.', data);
        return null; // Or throw an error
    }

  } catch (error) {
    console.error('Error calling image generation API:', error);
    // Re-throw the error to be handled by the calling component (e.g., TagCloud.vue)
    throw error;
  }
} 