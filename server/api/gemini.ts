// ~/nuxt-flux/server/api/gemini.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai'

export default defineEventHandler(async (event) => {
  // 1) Get API Key from runtime config
  const { public: { GEMINI_API_KEY } } = useRuntimeConfig()
  if (!GEMINI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Gemini API Key configuration' })
  }

  // 2) Get parameters from the request body
  const {
    prompt,
    temperature = 0.7, // Default value
    maxOutputTokens = 200, // Default value
    modelName = 'gemini-2.0-flash-lite' // Default model, adjust if needed
  } = await readBody<{ prompt: string; temperature?: number; maxOutputTokens?: number; modelName?: string }>(event)

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: 'Missing prompt text in request body' })
  }

  // 3) Initialize the Generative AI client
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: modelName,
    // Optional: Add safety settings if needed
    // safetySettings: [
    //   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    //   { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    // ],
  })

  // 4) Prepare generation configuration
  const generationConfig = {
    temperature,
    maxOutputTokens,
    // topP: 0.95, // Optional: Add other config as needed
    // topK: 64,   // Optional: Add other config as needed
  }

  // 5) Call the Generative AI model
  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    })

    const responseText = result.response.text()
    return { generatedText: responseText } // Return the generated text

  } catch (error: any) {
    console.error('Error calling Gemini API:', error)
    // Try to provide a more specific error message if possible
    const message = error.response?.data?.error?.message || error.message || 'Failed to generate content'
    throw createError({ statusCode: 500, statusMessage: `Gemini API Error: ${message}` })
  }
})
