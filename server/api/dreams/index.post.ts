import prisma from '~/server/utils/db';
import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';
import logger from '~/utils/logger';

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
});

type TagInput = z.infer<typeof BaseTagSchema> & {
  children?: TagInput[];
};

const TagSchema: z.ZodType<TagInput> = BaseTagSchema.extend({
  children: z.lazy(() => TagSchema.array()).optional(),
});

const DreamDataSchema = z.object({
  focusedZone: z.string(), // Assuming zone names are strings
  tags: z.array(TagSchema),
  generatedPrompt: z.string().optional(),
  imageUrl: z.string().nullable().optional(),
});
// ---------------------------

export default defineEventHandler(async (event) => {
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
  // Assuming authentication middleware adds user info to context
  // Example: event.context.auth = { userId: 'some-user-id' }
  const userId = event.context.auth?.userId as string | undefined;

  if (!userId) {
      logger.error('Authentication Error: Missing userId in request context.');
      throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized: User authentication required.',
      });
  }
  // ----------------------------

  try {
    const body = await readBody<{ title?: string; data: unknown }>(event);
    logger.debug('[POST /api/dreams] Request Body:', body);
    const { title, data } = body;

    // --- Zod Validation --- 
    const validationResult = DreamDataSchema.safeParse(data);

    if (!validationResult.success) {
        logger.warn('[POST /api/dreams] Validation Error:', validationResult.error.errors);
        // Format errors for a more user-friendly response
        const formattedErrors = validationResult.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        throw createError({
            statusCode: 400,
            statusMessage: 'Bad Request: Invalid data structure.',
            data: { code: 'VALIDATION_FAILED', errors: formattedErrors },
        });
    }
    
    // Use the validated data from now on
    const validatedData = validationResult.data;
    // ----------------------

    logger.debug(`[POST /api/dreams] Saving dream for user ${userId}`);
    const dream = await prisma.dream.create({
      data: {
        title, 
        // Prisma expects 'JsonValue', validatedData should be compatible
        data: validatedData as any, // Cast needed as Prisma Json type is broad
        userId: userId, // Associate dream with the authenticated user
      },
    });
    logger.info(`[POST /api/dreams] Saved dream ID: ${dream.id} for user ${userId}`);

    return dream;

  } catch (error: any) {
    logger.error(`[POST /api/dreams] Error for user ${userId || 'unknown'}:`, error);

    if (error.statusCode) {
        // Re-throw H3/validation errors
        throw error;
    }

    // TODO: Check for specific Prisma errors for more granular responses
    // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }

    // Return a structured error for other internal issues
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: {
        code: 'DREAM_SAVE_FAILED',
        message: error.message || 'Could not save dream due to an internal error.'
      }
    });
  }
}); 