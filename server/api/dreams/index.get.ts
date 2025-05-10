import prisma from '~/server/utils/db';
import { defineEventHandler, createError, H3Event } from 'h3';
import { getServerSession } from '#auth';
import { authOptions } from '~/server/api/auth/[...]'; // Path from server root

export default defineEventHandler(async (event: H3Event) => {
  const session = await getServerSession(event, authOptions);

  if (!session || !session.user) {
    // No user logged in, or session is invalid
    // Depending on requirements, you might throw an error or return an empty array
    // For "My Dreams", returning an empty array if not logged in seems reasonable.
    return [];
  }

  try {
    // Fetch dreams for the logged-in user
    const dreams = await prisma.dream.findMany({
      where: {
        // Assuming your Dream model has a 'userId' field linked to the User model
        // And session.user has an 'id' property (standard for Auth.js)
        userId: session.user.id as string, // Cast if necessary based on your User model / session structure
      },
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