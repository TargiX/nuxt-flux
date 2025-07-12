import prisma from '~/server/utils/db'
import type { H3Event } from 'h3';
import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'
import logger from '~/utils/logger'
import { getServerSession } from '#auth'
import { authOptions } from '~/server/api/auth/[...]'

// --- Zod Schema Definition ---
const BaseTagSchema = z.object({
  id: z.string(),
  text: z.string(),
  size: z.number(),
  selected: z.boolean(),
  zone: z.string(),
  alias: z.string(),
  parentId: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  isLoading: z.boolean().optional(),
  depth: z.number().optional(),
  isTransformed: z.boolean().optional(),
  originalText: z.string().optional(),
})

type TagInput = z.infer<typeof BaseTagSchema> & {
  children?: TagInput[]
}

const TagSchema: z.ZodType<TagInput> = BaseTagSchema.extend({
  children: z.lazy(() => TagSchema.array()).optional(),
})

const DreamDataSchema = z.object({
  focusedZone: z.string(), // Assuming zone names are strings
  tags: z.array(TagSchema),
  generatedPrompt: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
  zoneViewports: z.record(z.string(), z.object({
    x: z.number(),
    y: z.number(),
    k: z.number(),
  })).optional(), // Record of zone names to viewport states
})
// ---------------------------

export default defineEventHandler(async (event: H3Event) => {
  // --- Rate Limiting Placeholder ---
  // TODO: Implement rate limiting logic here.
  // Example: Check user's save count within a time window.
  // If exceeded, throw createError({ statusCode: 429, statusMessage: 'Too Many Requests' })
  // const userId = event.context.auth?.userId; // Example: Get user ID from context
  // if (userId) {
  //    const saveCount = await checkUserSaveCount(userId);
  //    if (saveCount >= MAX_SAVES_PER_DAY) { throw ... }
  // }
  // ----------------------------------

  // --- Authentication Check ---
  const session = await getServerSession(event, authOptions)
  if (!session || !session.user || !session.user.id) {
    logger.error('Authentication Error: Missing user session or user ID.')
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: User authentication required.',
    })
  }
  const userId = session.user.id as string // Use ID from session
  // ----------------------------

  try {
    // Updated to include optional dreamIdToUpdate and lastUsedModelId
    const body = await readBody<{ title?: string; data: unknown; dreamIdToUpdate?: number; lastUsedModelId?: string }>(event)
    logger.debug('[POST /api/dreams] Request Body:', body)
    const { title, data, dreamIdToUpdate, lastUsedModelId } = body

    // --- Zod Validation ---
    const validationResult = DreamDataSchema.safeParse(data)

    if (!validationResult.success) {
      logger.warn('[POST /api/dreams] Validation Error:', validationResult.error.errors)
      // Format errors for a more user-friendly response
      const formattedErrors = validationResult.error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Invalid data structure.',
        data: { code: 'VALIDATION_FAILED', errors: formattedErrors },
      })
    }

    // Use the validated data from now on
    const validatedData = validationResult.data

    // Log transformation state in the API
    console.log(`[API_SAVE] === RECEIVED SAVE REQUEST ===`)
    console.log(`[API_SAVE] dreamIdToUpdate: ${dreamIdToUpdate}`)
    console.log(`[API_SAVE] validatedData.tags length: ${validatedData.tags.length}`)

    const transformedInAPI = validatedData.tags.filter((tag) => tag.isTransformed)
    console.log(`[API_SAVE] Transformed tags in API: ${transformedInAPI.length}`)
    transformedInAPI.forEach((tag) => {
      console.log(
        `[API_SAVE] API transformed tag: ${tag.id} - "${tag.originalText}" -> "${tag.text}"`
      )
    })

    // ----------------------

    // Determine the title for the dream
    let dreamTitle = title // Use provided title by default
    if (!dreamTitle && validatedData.generatedPrompt) {
      const words = validatedData.generatedPrompt.split(/\s+/).slice(0, 6) // Get first 6 words
      dreamTitle = words.join(' ')
      if (validatedData.generatedPrompt.split(/\s+/).length > 6) {
        dreamTitle += '...' // Add ellipsis if prompt was longer
      }
    }
    if (!dreamTitle) {
      dreamTitle = 'Untitled Dream' // Fallback if no prompt and no title
    }

    let dream
    if (dreamIdToUpdate) {
      logger.debug(
        `[POST /api/dreams] Attempting to update dream ID: ${dreamIdToUpdate} for user ${userId} with title: ${dreamTitle}`
      )
      const existingDream = await prisma.dream.findUnique({
        where: {
          id: dreamIdToUpdate,
        },
      })

      if (!existingDream || existingDream.userId !== userId) {
        logger.warn(
          `[POST /api/dreams] Dream not found or user mismatch for update. Dream ID: ${dreamIdToUpdate}, User ID: ${userId}`
        )
        throw createError({
          statusCode: 404, // Or 403 if you prefer for auth mismatch
          statusMessage: 'Dream not found or not authorized to update this dream.',
          data: { code: 'DREAM_UPDATE_NOT_FOUND_OR_FORBIDDEN' },
        })
      }

      dream = await prisma.dream.update({
        where: {
          id: dreamIdToUpdate,
          // Redundant userId check here, but good for safety / if logic changes
          // userId: userId,
        },
        data: {
          title: dreamTitle,
          data: validatedData as object, // Prisma expects 'JsonValue'
          lastUsedModelId: lastUsedModelId, // Update the last used model
          // userId should not change during an update by the same user
        },
      })
      logger.info(`[POST /api/dreams] Updated dream ID: ${dream.id} for user ${userId}`)
    } else {
      logger.debug(
        `[POST /api/dreams] Saving new dream for user ${userId} with title: ${dreamTitle}`
      )
      dream = await prisma.dream.create({
        data: {
          title: dreamTitle,
          data: validatedData as object, // Prisma expects 'JsonValue'
          lastUsedModelId: lastUsedModelId, // Store the last used model for new dreams
          userId: userId,
        },
      })
      logger.info(`[POST /api/dreams] Saved new dream ID: ${dream.id} for user ${userId}`)
    }

    return dream
  } catch (error: unknown) {
    logger.error(`[POST /api/dreams] Error for user ${userId || 'unknown'}:`, error)

    if (error && typeof error === 'object' && 'statusCode' in error) {
      // Re-throw H3/validation errors
      throw error
    }

    // TODO: Check for specific Prisma errors for more granular responses
    // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }

    // Return a structured error for other internal issues
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        code: 'DREAM_SAVE_FAILED',
        message: (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') 
          ? error.message 
          : 'Could not save dream due to an internal error.',
      },
    })
  }
})
