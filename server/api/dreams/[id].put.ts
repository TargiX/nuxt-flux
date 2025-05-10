import prisma from '~/server/utils/db';
import { defineEventHandler, readBody, createError, H3Event } from 'h3';
import { z } from 'zod';
import logger from '~/utils/logger';
import { getServerSession } from '#auth';
import { authOptions } from '~/server/api/auth/[...]';

// Zod schema for request body validation
const UpdateDreamTitleSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(255, 'Title is too long'),
});

export default defineEventHandler(async (event: H3Event) => {
  const dreamId = event.context.params?.id;
  if (!dreamId || isNaN(parseInt(dreamId))) {
    logger.warn('[PUT /api/dreams/:id] Invalid dream ID format:', dreamId);
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request: Invalid dream ID format.',
    });
  }
  const numericDreamId = parseInt(dreamId);

  // --- Authentication Check ---
  const session = await getServerSession(event, authOptions);
  if (!session || !session.user || !session.user.id) {
    logger.error('[PUT /api/dreams/:id] Authentication Error: Missing user session or user ID.');
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized: User authentication required.',
    });
  }
  const userId = session.user.id as string;
  // ----------------------------

  try {
    const body = await readBody(event);
    logger.debug(`[PUT /api/dreams/${numericDreamId}] Request Body:`, body);

    // Validate body
    const validationResult = UpdateDreamTitleSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(`[PUT /api/dreams/${numericDreamId}] Validation Error:`, validationResult.error.errors);
      throw createError({
        statusCode: 400,
        statusMessage: 'Bad Request: Invalid title.',
        data: { code: 'VALIDATION_FAILED', errors: validationResult.error.format() },
      });
    }

    const { title: newTitle } = validationResult.data;

    // Check if the dream exists and belongs to the user
    const existingDream = await prisma.dream.findUnique({
      where: { id: numericDreamId },
    });

    if (!existingDream) {
      logger.warn(`[PUT /api/dreams/${numericDreamId}] Dream not found for user ${userId}.`);
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found: Dream not found.',
      });
    }

    if (existingDream.userId !== userId) {
      logger.warn(`[PUT /api/dreams/${numericDreamId}] User ${userId} attempted to update dream belonging to ${existingDream.userId}.`);
      throw createError({
        statusCode: 403,
        statusMessage: 'Forbidden: You do not have permission to update this dream.',
      });
    }

    // Update the dream
    const updatedDream = await prisma.dream.update({
      where: {
        id: numericDreamId,
        // Ensure userId matches, though already checked, it's good for safety
        userId: userId, 
      },
      data: {
        title: newTitle,
      },
    });

    logger.info(`[PUT /api/dreams/${numericDreamId}] Dream title updated for user ${userId}.`);
    return updatedDream;

  } catch (error: any) {
    logger.error(`[PUT /api/dreams/${dreamId}] Error for user ${userId || 'unknown'}:`, error);
    if (error.statusCode) {
      throw error; // Re-throw H3/validation errors
    }
    // TODO: More specific Prisma error handling if needed
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      data: { code: 'DREAM_UPDATE_FAILED', message: error.message || 'Could not update dream title.' },
    });
  }
}); 