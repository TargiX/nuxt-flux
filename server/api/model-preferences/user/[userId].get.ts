import { getUserPreferredModelForNewDream } from '~/services/modelPreferenceService'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
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