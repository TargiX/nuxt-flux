import { getUserPreferredModelForNewDream } from '~/services/modelPreferenceService'
import { getServerSession } from '#auth'
import { authOptions } from '~/server/api/auth/[...]'

export default defineEventHandler(async (event) => {
  // Check authentication
  const session = await getServerSession(event, authOptions)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const userId = getRouterParam(event, 'userId')
  
  // Ensure the user can only access their own preferences
  if (userId !== session.user.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied'
    })
  }

  try {
    const preferredModel = await getUserPreferredModelForNewDream(userId)
    
    return {
      success: true,
      preferredModel
    }
  } catch (error) {
    console.error('Error fetching user preferred model:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch user preferred model'
    })
  }
})