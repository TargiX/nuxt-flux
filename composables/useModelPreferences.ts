import type { ModelPreference } from '~/services/modelPreferenceService'

export const useModelPreferences = () => {
  const preferences = ref<ModelPreference[]>([])
  const favoriteModels = ref<string[]>([])
  const loading = ref(false)

  /**
   * Fetch user's model preferences
   */
  const fetchPreferences = async (favoritesOnly = false) => {
    loading.value = true
    try {
      const response = await $fetch('/api/model-preferences', {
        query: { favoritesOnly: favoritesOnly.toString() }
      })

      if (favoritesOnly) {
        favoriteModels.value = response.favoriteModels || []
      } else {
        preferences.value = response.preferences || []
        // Extract favorites from full preferences
        favoriteModels.value = preferences.value
          .filter(p => p.isFavorite)
          .map(p => p.modelId)
      }
    } catch (error) {
      console.error('Failed to fetch model preferences:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  /**
   * Toggle model favorite status
   */
  const toggleFavorite = async (modelId: string) => {
    try {
      const response = await $fetch('/api/model-preferences', {
        method: 'POST',
        body: {
          modelId,
          action: 'toggle'
        }
      })

      const updatedPreference = response.preference

      // Since we only allow one favorite, refresh the entire favorites list
      await fetchPreferences(true) // Refresh favorites only
      
      // Also update full preferences if we have them
      if (preferences.value.length > 0) {
        const existingIndex = preferences.value.findIndex(p => p.modelId === modelId)
        if (existingIndex >= 0) {
          preferences.value[existingIndex] = updatedPreference
        } else {
          preferences.value.push(updatedPreference)
        }
        
        // Update other preferences that might have been unfavorited
        preferences.value.forEach(pref => {
          if (pref.modelId !== modelId && updatedPreference.isFavorite) {
            pref.isFavorite = false
          }
        })
      }

      return updatedPreference
    } catch (error) {
      console.error('Failed to toggle model favorite:', error)
      throw error
    }
  }

  /**
   * Set model favorite status explicitly
   */
  const setFavorite = async (modelId: string, isFavorite: boolean) => {
    try {
      const response = await $fetch('/api/model-preferences', {
        method: 'POST',
        body: {
          modelId,
          action: 'set',
          isFavorite
        }
      })

      const updatedPreference = response.preference

      // Update local state
      const existingIndex = preferences.value.findIndex(p => p.modelId === modelId)
      if (existingIndex >= 0) {
        preferences.value[existingIndex] = updatedPreference
      } else {
        preferences.value.push(updatedPreference)
      }

      // Update favorites list
      if (isFavorite) {
        if (!favoriteModels.value.includes(modelId)) {
          favoriteModels.value.push(modelId)
        }
      } else {
        favoriteModels.value = favoriteModels.value.filter(id => id !== modelId)
      }

      return updatedPreference
    } catch (error) {
      console.error('Failed to set model favorite:', error)
      throw error
    }
  }

  /**
   * Check if a model is favorited
   */
  const isFavorite = (modelId: string): boolean => {
    return favoriteModels.value.includes(modelId)
  }

  /**
   * Get sorted models with favorites first
   */
  const getSortedModels = (models: any[]) => {
    return [...models].sort((a, b) => {
      const aIsFavorite = isFavorite(a.value || a.id)
      const bIsFavorite = isFavorite(b.value || b.id)
      
      // Favorites come first
      if (aIsFavorite && !bIsFavorite) return -1
      if (!aIsFavorite && bIsFavorite) return 1
      
      // Then sort alphabetically by label or name
      const aName = a.label || a.name || ''
      const bName = b.label || b.name || ''
      return aName.localeCompare(bName)
    })
  }

  return {
    preferences: readonly(preferences),
    favoriteModels: readonly(favoriteModels),
    loading: readonly(loading),
    fetchPreferences,
    toggleFavorite,
    setFavorite,
    isFavorite,
    getSortedModels
  }
}