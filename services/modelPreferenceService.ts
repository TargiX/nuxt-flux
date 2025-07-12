import prisma from '~/server/utils/db'

export interface ModelPreference {
  modelId: string
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Get user's model preferences
 */
export async function getUserModelPreferences(userId: string): Promise<ModelPreference[]> {
  const preferences = await prisma.userModelPreference.findMany({
    where: { userId },
    select: {
      modelId: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true
    }
  })
  
  return preferences
}

/**
 * Get user's favorite models only
 */
export async function getUserFavoriteModels(userId: string): Promise<string[]> {
  const favorites = await prisma.userModelPreference.findMany({
    where: { 
      userId,
      isFavorite: true 
    },
    select: { modelId: true }
  })
  
  return favorites.map(f => f.modelId)
}

/**
 * Toggle model favorite status
 */
export async function toggleModelFavorite(userId: string, modelId: string): Promise<ModelPreference> {
  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })
  
  if (!user) {
    // List all users in database for debugging
    const allUsers = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    })
    console.log('All users in database:', allUsers)
    throw new Error(`User with ID ${userId} does not exist. Database has ${allUsers.length} users.`)
  }
  
  console.log('User found:', user.id, user.email)

  // Check if preference already exists
  const existing = await prisma.userModelPreference.findUnique({
    where: {
      userId_modelId: { userId, modelId }
    }
  })

  if (existing) {
    // If toggling to favorite, unfavorite all others first
    if (!existing.isFavorite) {
      await prisma.userModelPreference.updateMany({
        where: {
          userId,
          isFavorite: true
        },
        data: {
          isFavorite: false
        }
      })
    }

    // Toggle existing preference
    const updated = await prisma.userModelPreference.update({
      where: {
        userId_modelId: { userId, modelId }
      },
      data: {
        isFavorite: !existing.isFavorite
      },
      select: {
        modelId: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return updated
  } else {
    // Unfavorite all existing favorites first
    await prisma.userModelPreference.updateMany({
      where: {
        userId,
        isFavorite: true
      },
      data: {
        isFavorite: false
      }
    })

    // Create new preference as favorite
    const created = await prisma.userModelPreference.create({
      data: {
        userId,
        modelId,
        isFavorite: true
      },
      select: {
        modelId: true,
        isFavorite: true,
        createdAt: true,
        updatedAt: true
      }
    })
    return created
  }
}

/**
 * Set model favorite status explicitly
 */
export async function setModelFavorite(userId: string, modelId: string, isFavorite: boolean): Promise<ModelPreference> {
  const result = await prisma.userModelPreference.upsert({
    where: {
      userId_modelId: { userId, modelId }
    },
    create: {
      userId,
      modelId,
      isFavorite
    },
    update: {
      isFavorite
    },
    select: {
      modelId: true,
      isFavorite: true,
      createdAt: true,
      updatedAt: true
    }
  })
  
  return result
}

/**
 * Update dream's last used model
 */
export async function updateDreamLastUsedModel(dreamId: number, modelId: string): Promise<void> {
  await prisma.dream.update({
    where: { id: dreamId },
    data: { lastUsedModelId: modelId }
  })
}

/**
 * Get dream's last used model
 */
export async function getDreamLastUsedModel(dreamId: number): Promise<string | null> {
  const dream = await prisma.dream.findUnique({
    where: { id: dreamId },
    select: { lastUsedModelId: true }
  })
  
  return dream?.lastUsedModelId || null
}

/**
 * Get user's preferred model for new dreams (first favorite, or default)
 */
export async function getUserPreferredModelForNewDream(userId: string): Promise<string> {
  // Get user's favorite models
  const favorites = await getUserFavoriteModels(userId)
  
  if (favorites.length > 0) {
    // Return the first favorite (most recently favorited)
    return favorites[0]
  }
  
  // Fall back to default model
  const { getDefaultModel } = await import('~/services/modelConfigService')
  return getDefaultModel()
}