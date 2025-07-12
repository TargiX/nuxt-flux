import type { H3Event } from 'h3'
import { defineEventHandler, readBody, createError } from 'h3'
import { generateImage } from '~/server/services/aiImageGenerator'
import { generateIconForTag } from '~/server/services/tagAppearanceService'
import prisma from '~/server/utils/db'
import type { ModelGenerationOptions } from '~/types/models'

interface GenerateImageBody {
  prompt: string
  modelId?: string
  aspectRatio?: string
  options?: ModelGenerationOptions
  selectedTagAliases?: string[]
}

export default defineEventHandler(async (event) => {
  try {
    const {
      prompt,
      modelId = 'gemini-flash',
      aspectRatio,
      options = {},
      selectedTagAliases = [],
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
    if (selectedTagAliases.length > 0) {
      triggerIconGeneration(selectedTagAliases, event).catch((err) => {
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

async function triggerIconGeneration(aliases: string[], event: H3Event) {
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

  // 2. Determine which tags need icons
  const aliasesToGenerate = aliases.filter((alias) => !existingAliases.has(alias))

  // 3. Trigger generation for each one
  for (const alias of aliasesToGenerate) {
    // We don't await here to make it fire-and-forget
    generateIconForTag(alias).catch((err) => {
      console.error(`Failed to generate icon for tag '${alias}' in background:`, err)
    })
  }
}
