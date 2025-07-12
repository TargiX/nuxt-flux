import type { H3Event } from 'h3'
import { defineEventHandler, readBody, createError } from 'h3'
import { generateImage } from '~/server/services/aiImageGenerator'
import { generateIconForTag } from '~/server/services/tagAppearanceService'
import type { ModelGenerationOptions } from '~/types/models'
// Using console.* for logging

interface GenerateImageBody {
  prompt: string
  modelId?: string
  aspectRatio?: string
  options?: ModelGenerationOptions
  selectedTagAliases?: string[]
  selectedTagsData?: Array<{ alias: string; text: string }>
}

export default defineEventHandler(async (event: H3Event) => {
  try {
    const {
      prompt,
      modelId = 'gemini-flash',
      aspectRatio,
      options = {},
      selectedTagAliases = [],
      selectedTagsData = [],
    } = await readBody<GenerateImageBody>(event)

    if (!prompt) {
      throw createError({ statusCode: 400, statusMessage: 'Missing prompt text in request body' })
    }

    // Merge aspect ratio into options if provided
    if (aspectRatio) {
      options.aspect_ratio = aspectRatio as '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
    }

    // --- Main Image Generation ---
    const result = await generateImage(prompt, modelId, options)

    // --- Asynchronous Icon Generation (Fire-and-Forget) ---
    if (selectedTagsData.length > 0) {
      triggerIconGeneration(selectedTagsData).catch((err) => {
        console.error('Error in background icon generation process:', err)
      })
    } else if (selectedTagAliases.length > 0) {
      // Fallback for backward compatibility
      const fallbackTagsData = selectedTagAliases.map(alias => ({ alias, text: alias.replace(/-/g, ' ') }))
      triggerIconGeneration(fallbackTagsData).catch((err) => {
        console.error('Error in background icon generation process:', err)
      })
    }

    return {
      imageBase64: result.imageBase64,
      metadata: result.metadata,
    }
  } catch (error: unknown) {
    console.error('Error in generate-image API:', error)

    // Check if it's an H3Error
    if (typeof error === 'object' && error !== null && 'statusCode' in error) {
      throw error
    }

    // Check if it's a standard Error
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Image generation failed: ${error.message}`,
      })
    }

    // Fallback for unknown error types
    throw createError({
      statusCode: 500,
      statusMessage: 'An unknown error occurred during image generation.',
    })
  }
})

async function triggerIconGeneration(tagsData: Array<{ alias: string; text: string }>) {
  if (!tagsData || tagsData.length === 0) {
    console.log('[GenerateImage] No tags data provided for icon generation.')
    return
  }

  for (const { alias, text } of tagsData) {
    console.log(
      `[GenerateImage] Triggering icon generation for alias: "${alias}" with text: "${text}"`
    )
    // Fire-and-forget direct service call
    generateIconForTag(alias, text)
      .then((res: { success: true; imageUrl?: string; message?: string }) => {
        if (res.success) {
          console.log(
            `[GenerateImage] Icon generation succeeded for '${alias}'. ${
              res.imageUrl ? `URL: ${res.imageUrl}` : res.message
            }`
          )
        } else {
          console.warn(
            `[GenerateImage] Icon generation for '${alias}' returned success=false. Message: ${res.message}`
          )
        }
      })
      .catch((err: unknown) => {
        console.error(
          `[GenerateImage] Failed to generate icon for tag '${alias}':`,
          err
        )
      })
  }
}
