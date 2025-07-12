import { defineEventHandler, readBody, createError } from 'h3'
import { GoogleGenAI } from '@google/genai'

export default defineEventHandler(async (event) => {
  // Only allow POST requests
  if (event.node.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }
  const {
    public: { GEMINI_API_KEY },
  } = useRuntimeConfig()

  if (!GEMINI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Gemini API Key configuration' })
  }

  // Parse tags from request body
  const { tags } = await readBody<{ tags: string[] }>(event)
  if (!Array.isArray(tags) || tags.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Tags array is required and cannot be empty',
    })
  }

  // Normalize and join tags into a string
  const normalizedTags = tags.map((t) => t.trim()).filter((t) => t.length > 0)
  const tagsString = normalizedTags.join(', ')

  // Construct the image generation prompt server-side
  const generationPrompt = `You are creating an image prompt based on the following tags: ${tagsString}. You should create a prompt that closely matches these tags, formatted for an image generator, with no extra words before or after.`

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash-lite',
      contents: generationPrompt,
      config: {
        temperature: 0.5,
        maxOutputTokens: 1000,
      }
    })

    const responseText = result.text
    return { generatedText: responseText }
  } catch (error: unknown) {
    console.error('Error in /api/prompt:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate prompt'
    throw createError({ statusCode: 500, statusMessage: `Prompt API Error: ${message}` })
  }
})
