import { defineEventHandler, readBody, createError, getQuery } from 'h3'
import { getServerSession } from '#auth'
import { 
  getUserModelPreferences, 
  getUserFavoriteModels, 
  toggleModelFavorite, 
  setModelFavorite 
} from '~/services/modelPreferenceService'

export default defineEventHandler(async (event) => {
  // Get user session
  const session = await getServerSession(event)
  if (!session?.user?.id) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  const userId = session.user.id

  // Handle GET request - fetch user preferences
  if (event.node.req.method === 'GET') {
    const query = getQuery(event)
    const favoritesOnly = query.favoritesOnly === 'true'

    try {
      if (favoritesOnly) {
        const favorites = await getUserFavoriteModels(userId)
        return { favoriteModels: favorites }
      } else {
        const preferences = await getUserModelPreferences(userId)
        return { preferences }
      }
    } catch (error) {
      console.error('Error fetching model preferences:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to fetch model preferences' })
    }
  }

  // Handle POST request - toggle/set favorite
  if (event.node.req.method === 'POST') {
    const { modelId, action = 'toggle', isFavorite } = await readBody<{
      modelId: string
      action?: 'toggle' | 'set'
      isFavorite?: boolean
    }>(event)

    if (!modelId) {
      throw createError({ statusCode: 400, statusMessage: 'modelId is required' })
    }

    try {
      let result
      if (action === 'toggle') {
        result = await toggleModelFavorite(userId, modelId)
      } else if (action === 'set') {
        if (typeof isFavorite !== 'boolean') {
          throw createError({ statusCode: 400, statusMessage: 'isFavorite is required for set action' })
        }
        result = await setModelFavorite(userId, modelId, isFavorite)
      } else {
        throw createError({ statusCode: 400, statusMessage: 'Invalid action. Use "toggle" or "set"' })
      }

      return { preference: result }
    } catch (error) {
      console.error('Error updating model preference:', error)
      throw createError({ statusCode: 500, statusMessage: 'Failed to update model preference' })
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})