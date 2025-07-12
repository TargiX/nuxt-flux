import prisma from '~/server/utils/db'
import type { H3Event } from 'h3';
import { defineEventHandler, createError } from 'h3'
import { getServerSession } from '#auth'
import { authOptions } from '~/server/api/auth/[...]'

export default defineEventHandler(async (event: H3Event) => {
  const session = await getServerSession(event, authOptions)
  if (!session || !session.user || !session.user.id) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const idParam = event.context.params?.id
  const idNum = typeof idParam === 'string' ? parseInt(idParam, 10) : NaN
  if (isNaN(idNum)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid dream ID' })
  }

  const dream = await prisma.dream.findUnique({
    where: { id: idNum },
    select: { data: true, userId: true },
  })
  if (!dream) {
    throw createError({ statusCode: 404, statusMessage: 'Dream not found' })
  }
  if (dream.userId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // Ensure backwards compatibility by adding default zoneViewports if missing
  const dreamData = dream.data as Record<string, unknown>
  if (!dreamData.zoneViewports) {
    dreamData.zoneViewports = {}
  }
  
  // Return the stored data JSON
  return dreamData
})
