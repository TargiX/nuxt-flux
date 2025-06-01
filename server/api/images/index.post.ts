import prisma from '~/server/utils/db'
import { getServerSession } from '#auth';
import { authOptions } from '~/server/api/auth/[...]'; // Path from server root
import { uploadImage } from '~/server/utils/storage'; // Added import
import { Buffer } from 'node:buffer'; // Added import

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
    // Decode base64 image and upload to S3
    if (!imageUrl.startsWith('data:image/')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid image format. Expected base64 encoded image.',
      });
    }
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Generate a filename, e.g., based on dreamId and a unique part
    const filename = `dream_${dreamId}_${Date.now()}.png`; // Or use uuid

    const uploadedImageUrl = await uploadImage(imageBuffer, filename, `user-${session.user.id}/dream-${dreamId}`);

    const newImage = await prisma.generatedImage.create({
      data: {
        imageUrl: uploadedImageUrl, // Store the S3 URL
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
    // Handle errors from uploadImage if they are not already creating an error with statusCode
    if (error.message && error.message.startsWith('Failed to upload image')) {
      throw createError({
        statusCode: 500,
        statusMessage: error.message,
      });
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save generated image.',
    });
  }
}); 