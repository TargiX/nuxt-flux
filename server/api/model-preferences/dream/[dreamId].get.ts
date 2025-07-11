import { getDreamLastUsedModel } from '~/services/modelPreferenceService'
import { getServerSession } from '#auth'
import { authOptions } from '~/server/api/auth/[...]'

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getServerSession(event, authOptions)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const dreamIdParam = getRouterParam(event, 'dreamId')
  
  if (!dreamIdParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dream ID is required'
    })
  }

  const dreamId = parseInt(dreamIdParam, 10)
  if (isNaN(dreamId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid Dream ID format'
    })
  }

  try {
    const lastUsedModel = await getDreamLastUsedModel(dreamId)
    
    return {
      success: true,
      lastUsedModel
    }
  } catch (error) {
    console.error('Error fetching dream last used model:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch dream last used model'
    })
  }
})