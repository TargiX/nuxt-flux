import { PrismaClient } from '@prisma/client';
import { defineEventHandler, readBody, createError } from 'h3';

// Instantiate Prisma Client outside the handler for reuse
const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  try {
    // Read the body, expecting 'title' (optional) and 'data' (required)
    const body = await readBody<{ title?: string; data: any }>(event);
    console.log("Received body for /api/dreams POST:", JSON.stringify(body, null, 2)); // Log received data
    const { title, data } = body;

    // Basic validation: Ensure 'data' exists
    if (!data) {
      console.error('Validation Error: Missing data field');
      throw createError({
        statusCode: 400,
        statusMessage: "Bad Request: Missing required \'data\' field in request body.", // Escaped quote
      });
    }

    // Add more specific validation if needed (e.g., typeof data === 'object')
    if (typeof data !== 'object' || data === null) {
        console.error('Validation Error: Data field is not an object');
        throw createError({
            statusCode: 400,
            statusMessage: "Bad Request: \'data\' field must be an object.",
        });
    }

    console.log('Attempting to save dream to database...');
    // Create the dream entry in the database
    const dream = await prisma.dream.create({
      data: {
        title, // Will be null if not provided
        data,  // The actual graph state or other JSON data
      },
    });
    console.log('Dream saved successfully with ID:', dream.id);

    // Return the newly created dream
    return dream;

  } catch (error: any) {
    // Log the specific error encountered during creation
    console.error("Error processing /api/dreams POST:", error);

    // Throw a generic server error, hiding internal details
    // If it's an H3 error (like our 400), re-throw it
    if (error.statusCode) {
      throw error;
    }
    
    // Check for Prisma-specific errors if possible (example)
    // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error: Could not save dream.',
    });
  }
}); 