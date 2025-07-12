import { getDreamLastUsedModel } from '~/services/modelPreferenceService'

export default defineEventHandler(async (event) => {
  const dreamId = getRouterParam(event, 'dreamId')
  
  if (!dreamId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dream ID is required'
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