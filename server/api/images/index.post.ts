import prisma from '~/server/utils/db'
import { getServerSession } from '#auth';
import { authOptions } from '~/server/api/auth/[...]'; // Path from server root

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event, authOptions);
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    });
  }


  
  const body = await readBody(event);
  const { imageUrl, promptText, dreamId, graphState } = body;

  if (!imageUrl || !dreamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: imageUrl and dreamId are required.',
    });
  }

  try {
    const newImage = await prisma.generatedImage.create({
      data: {
        imageUrl,
        promptText: promptText || null,
        dreamId: parseInt(dreamId, 10), // Ensure dreamId is an integer
        userId: session.user.id,
        graphState: graphState || null, // Save the graphState
      },
    });
    return newImage;
  } catch (error: any) {
    console.error('Error saving generated image:', error);
    // Check for specific Prisma errors if needed, e.g., foreign key constraint
    if (error.code === 'P2003' && error.meta?.field_name?.includes('dreamId')) {
         throw createError({
            statusCode: 404,
            statusMessage: `Dream with ID ${dreamId} not found.`,
          });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save generated image.',
    });
  }
}); 