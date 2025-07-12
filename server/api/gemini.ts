// ~/nuxt-flux/server/api/gemini.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { GoogleGenAI } from '@google/genai'

export default defineEventHandler(async (event) => {
  // 1) Get API Key from runtime config
  const {
    public: { GEMINI_API_KEY },
  } = useRuntimeConfig()
  if (!GEMINI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Gemini API Key configuration' })
  }

  // 2) Get parameters from the request bo

  const {
    prompt,
    temperature = 1, // Default value
    maxOutputTokens = 200, // Default value
    modelName = 'gemini-2.0-flash-lite', // Default model, adjust if needed
  } = await readBody<{
    prompt: string
    temperature?: number
    maxOutputTokens?: number
    modelName?: string
  }>(event)

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Missing prompt text in request body' })
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

  // 4) Call the new Generative AI model
  try {
    const result = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature,
        maxOutputTokens,
        // topP: 0.95, // Optional: Add other config as needed
        // topK: 64,   // Optional: Add other config as needed
      }
    })

    const responseText = result.text
    return { generatedText: responseText } // Return the generated text
  } catch (error: any) {
    console.error('Error calling Gemini API:', error)
    // Try to provide a more specific error message if possible
    const message =
      error.response?.data?.error?.message || error.message || 'Failed to generate content'
    throw createError({ statusCode: 500, statusMessage: `Gemini API Error: ${message}` })
  }
})
