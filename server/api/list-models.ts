import { defineEventHandler, createError } from 'h3'
import { GoogleGenAI } from '@google/genai'

export default defineEventHandler(async (event) => {
  try {
    const runtimeConfig = useRuntimeConfig()
    
    if (!runtimeConfig.GEMINI_API_KEY) {
      throw createError({ statusCode: 500, statusMessage: 'Missing Gemini API Key' })
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({ apiKey: runtimeConfig.GEMINI_API_KEY })
    
    // List all available models using new SDK
    const models = await ai.models.list()
    
    // Filter models and categorize them
    const availableModels = models.map(model => ({
      name: model.name,
      displayName: model.displayName || model.name,
      description: model.description || '',
      supportedGenerationMethods: model.supportedGenerationMethods || [],
      inputTokenLimit: model.inputTokenLimit || 0,
      outputTokenLimit: model.outputTokenLimit || 0,
      version: model.version || ''
    }))

    // Separate by generation methods
    const textModels = availableModels.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    )
    
    const imageModels = availableModels.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent') &&
      (model.name.includes('image') || model.description?.toLowerCase().includes('image'))
    )

    return {
      all: availableModels,
      textModels,
      imageModels,
      totalCount: availableModels.length
    }
  } catch (error: any) {
    console.error('Error listing models:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to list models: ${error.message}`
    })
  }
})