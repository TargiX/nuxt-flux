import { ref, watch } from 'vue'
import { useTagStore } from '~/store/tagStore'
import { useDreamManagement } from '~/composables/useDreamManagement'
import { useToast } from 'primevue/usetoast'

export function useAutoSave() {
  const tagStore = useTagStore()
  const { performSaveAsNew } = useDreamManagement()
  const toast = useToast()

  const isAutoSaveEnabled = ref(true)
  const autoSaveInterval = ref(60000) // 1 minute default
  const lastAutoSave = ref<Date | null>(null)
  const autoSaveTimer = ref<NodeJS.Timeout | null>(null)

  // Load preferences from localStorage
  const loadPreferences = () => {
    const enabled = localStorage.getItem('autoSaveEnabled')
    if (enabled !== null) {
      isAutoSaveEnabled.value = enabled === 'true'
    }

    const interval = localStorage.getItem('autoSaveInterval')
    if (interval) {
      autoSaveInterval.value = parseInt(interval, 10)
    }
  }

  // Save preferences to localStorage
  const savePreferences = () => {
    localStorage.setItem('autoSaveEnabled', String(isAutoSaveEnabled.value))
    localStorage.setItem('autoSaveInterval', String(autoSaveInterval.value))
  }

  // Perform auto-save
  const performAutoSave = async () => {
    if (!isAutoSaveEnabled.value || !tagStore.hasUnsavedChanges) {
      return
    }

    // Don't auto-save if no tags are selected
    const selectedTags = tagStore.tags.filter((t) => t.selected)
    if (selectedTags.length === 0) {
      return
    }

    try {
      const dreamData = {
        focusedZone: tagStore.focusedZone,
        tags: tagStore.tags,
        generatedPrompt: tagStore.currentGeneratedPrompt,
        imageUrl: tagStore.currentImageUrl,
      }

      // If it's a new dream (no ID), save as new
      if (tagStore.loadedDreamId === null) {
        const result = await performSaveAsNew(dreamData, toast, tagStore, 'Auto-saved Dream')
        if (result) {
          lastAutoSave.value = new Date()
          // Show subtle notification
          toast.add({
            severity: 'info',
            summary: 'Auto-saved',
            detail: 'Your dream has been automatically saved',
            life: 2000,
            closable: false,
          })
        }
      } else {
        // For existing dreams, we would update
        // This would require adding an update function to the composable
        // For now, we'll skip auto-save for existing dreams
        console.log('Auto-save for existing dreams not yet implemented')
      }
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }

  // Start auto-save timer
  const startAutoSave = () => {
    stopAutoSave() // Clear any existing timer

    if (!isAutoSaveEnabled.value) {
      return
    }

    autoSaveTimer.value = setInterval(() => {
      performAutoSave()
    }, autoSaveInterval.value)
  }

  // Stop auto-save timer
  const stopAutoSave = () => {
    if (autoSaveTimer.value) {
      clearInterval(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
  }

  // Watch for changes to preferences
  watch([isAutoSaveEnabled, autoSaveInterval], () => {
    savePreferences()
    startAutoSave() // Restart with new settings
  })

  // Watch for unsaved changes
  watch(
    () => tagStore.hasUnsavedChanges,
    (hasChanges) => {
      if (hasChanges && isAutoSaveEnabled.value && !autoSaveTimer.value) {
        startAutoSave()
      } else if (!hasChanges && autoSaveTimer.value) {
        stopAutoSave()
      }
    }
  )

  // Initialize
  loadPreferences()
  if (tagStore.hasUnsavedChanges) {
    startAutoSave()
  }

  // Clean up on unmount
  onUnmounted(() => {
    stopAutoSave()
  })

  return {
    isAutoSaveEnabled,
    autoSaveInterval,
    lastAutoSave,
    performAutoSave,
    startAutoSave,
    stopAutoSave,
  }
}
