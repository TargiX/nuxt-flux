import { defineEventHandler, readBody, createError } from 'h3'
import { GoogleGenAI } from '@google/genai'

// Define specific response/candidate types for clarity
interface InlineDataPart {
  mimeType: string
  data: string
}
interface ContentPart {
  text?: string
  inlineData?: InlineDataPart
}
interface GeminiCandidate {
  content: { parts: ContentPart[] }
  // Add other relevant candidate properties if needed, e.g., safetyRatings
}
interface GeminiImageApiResponse {
  candidates?: GeminiCandidate[]
  // Add other response properties if needed
}

export default defineEventHandler(async (event) => {
  // 1) Get API Key from runtime config
  const {
    public: { GEMINI_API_KEY },
  } = useRuntimeConfig()
  if (!GEMINI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Gemini API Key configuration' })
  }

  // 2) Get parameters from the request body
  // We only need the prompt for this specific endpoint
  const { prompt } = await readBody<{ prompt: string }>(event)

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Missing prompt text in request body' })
  }

  // 3) Initialize the Generative AI client
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

  // 5) Call the Generative AI model
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: prompt,
      config: {
        temperature: 0.4, // Example: Slightly lower temp for more predictable images
        maxOutputTokens: 2048, // Example: Potentially allow more tokens if needed
        responseModalities: ['Image', 'Text'], // Must include both for Gemini image models
      }
    })

    const response = result as GeminiImageApiResponse

    // 6) Parse the response to find the image data
    if (response && response.candidates && response.candidates.length > 0) {
      const firstCandidate = response.candidates[0]
      if (!firstCandidate.content) {
        console.error('Gemini API Error: First candidate has no content property.', firstCandidate)
        throw createError({
          statusCode: 500,
          statusMessage: 'Gemini Image API Error: Response candidate is missing content property.',
        })
      }

      const parts = firstCandidate.content.parts
      if (!parts) {
        console.error(
          'Gemini API Error: First candidate content has no parts property.',
          firstCandidate.content
        )
        throw createError({
          statusCode: 500,
          statusMessage:
            'Gemini Image API Error: Response candidate content is missing parts property.',
        })
      }

      for (const part of parts) {
        if (part.inlineData) {
          // Return the base64 image string directly
          return { imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` }
        }
      }
      // If no image part found
      console.warn('Gemini response did not contain image data for prompt:', prompt)
      throw createError({
        statusCode: 500,
        statusMessage: 'Image generation succeeded but no image data found in response.',
      })
    } else {
      console.warn('Gemini response contained no candidates for prompt:', prompt)
      throw createError({ statusCode: 500, statusMessage: 'Image generation returned no results.' })
    }
  } catch (error: any) {
    console.error('Error calling Gemini Image API:', error)
    const message =
      error.response?.data?.error?.message || error.message || 'Failed to generate image content'
    // Use the status code from the error if available, otherwise default to 500
    const statusCode = error.statusCode || error.response?.status || 500
    throw createError({
      statusCode: statusCode,
      statusMessage: `Gemini Image API Error: ${message}`,
    })
  }
})
