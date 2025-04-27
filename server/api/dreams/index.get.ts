import { PrismaClient } from '@prisma/client';
import { defineEventHandler, createError } from 'h3';

// Instantiate Prisma Client outside the handler for reuse
const prisma = new PrismaClient();

export default defineEventHandler(async () => {
  try {
    // Fetch all dreams, ordering by creation date (newest first)
    const dreams = await prisma.dream.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return dreams;

  } catch (error: any) {
    // Log the error for server-side debugging
    console.error("Error fetching dreams:", error);

    // Throw a generic server error
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not retrieve dreams.',
    });
  }
}); 