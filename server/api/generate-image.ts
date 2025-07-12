import type { H3Event } from 'h3'
import { defineEventHandler, readBody, createError } from 'h3'
import { generateImage } from '~/server/services/aiImageGenerator'
import prisma from '~/server/utils/db'
import type { ModelGenerationOptions } from '~/types/models'
import logger from '~/utils/logger'

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
      triggerIconGeneration(selectedTagsData, event).catch((err) => {
        logger.error('Error in background icon generation process:', err)
      })
    } else if (selectedTagAliases.length > 0) {
      // Fallback for backward compatibility
      const fallbackTagsData = selectedTagAliases.map(alias => ({ alias, text: alias.replace(/-/g, ' ') }))
      triggerIconGeneration(fallbackTagsData, event).catch((err) => {
        logger.error('Error in background icon generation process:', err)
      })
    }

    return {
      imageBase64: result.imageBase64,
      metadata: result.metadata,
    }
  } catch (error: unknown) {
    logger.error('Error in generate-image API:', error)

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

async function triggerIconGeneration(tagsData: Array<{ alias: string; text: string }>, event: H3Event) {
  const aliases = tagsData.map(tag => tag.alias)
  
  // 1. Find which tags already have icons
  const existingAppearances = await prisma.tagAppearance.findMany({
    where: {
      id: { in: aliases },
    },
    select: {
      id: true, // Select only the ID for efficiency
    },
  })
  const existingAliases = new Set(existingAppearances.map((a: { id: string }) => a.id))
  logger.info(
    `[GenerateImage] Found ${existingAliases.size} existing icons for aliases: ${Array.from(
      existingAliases
    ).join(', ')}`
  )

  // 2. Determine which tags need icons
  const tagsToGenerate = tagsData.filter((tag) => !existingAliases.has(tag.alias))

  if (tagsToGenerate.length === 0) {
    logger.info('[GenerateImage] No new tag icons need to be generated.')
    return
  }

  // 3. Trigger generation for each one by calling the internal API
  const baseUrl = event.node.req.headers.host
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

  for (const tag of tagsToGenerate) {
    const url = `${protocol}://${baseUrl}/api/internal/tags/generate-icon`
    logger.info(`[GenerateImage] Firing POST request to ${url} for alias: ${tag.alias} with text: ${tag.text}`)
    // We don't await here to make it fire-and-forget
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias: tag.alias, displayText: tag.text }),
    }).catch((err) => {
      logger.error(`[GenerateImage] Failed to trigger icon generation for tag '${tag.alias}':`, err)
    })
  }
}
