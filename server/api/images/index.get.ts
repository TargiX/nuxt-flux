import prisma from '~/server/utils/db'
import { getServerSession } from '#auth'
import { authOptions } from '~/server/api/auth/[...]' // Path from server root

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event, authOptions)
  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const query = getQuery(event)
  const dreamId = query.dreamId ? parseInt(query.dreamId as string, 10) : null

  if (!dreamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required query parameter: dreamId',
    })
  }

  try {
    const images = await prisma.generatedImage.findMany({
      where: {
        dreamId: dreamId,
        userId: session.user.id, // Ensure user can only fetch their own images
      },
      orderBy: {
        createdAt: 'desc', // Show newest images first
      },
    })
    return images
  } catch (error) {
    console.error('Error fetching generated images:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch generated images.',
    })
  }
})
