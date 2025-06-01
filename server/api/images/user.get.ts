import { getServerSession } from '#auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const session = await getServerSession(event)

  if (!session || !session.user || !session.user.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const userId = session.user.id

  try {
    const images = await prisma.generatedImage.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      // Optionally, select specific fields if not all are needed for the gallery view
      // select: {
      //   id: true,
      //   imageUrl: true,
      //   promptText: true,
      //   createdAt: true,
      // }
    })
    return images
  } catch (error: any) {
    console.error('Error fetching user images:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch images. Please try again later.',
      data: error.message, // Optionally include error message in data for debugging
    })
  }
}) 