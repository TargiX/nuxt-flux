import { ref, watch, onMounted } from 'vue'
import type { Dream, DreamSummary } from '~/types/dream'
import { useTagStore } from '~/store/tagStore'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useErrorTracking } from '~/composables/useErrorTracking'
// Menu component instance methods like .toggle() are handled by passing the ref from the calling component

interface ValidationError {
  field: string
  message: string
}

interface Tag {
  id: string
  text: string
  originalText?: string
  isTransformed?: boolean
  cluster?: number
  vx?: number
  vy?: number
  x?: number
  y?: number
}

// Add a module-level flag to track if we've fetched dreams list
let dreamsListFetched = false
// console.log('[useDreamManagement] Module scope: dreamsListFetched initialized to', dreamsListFetched); // Keep for debugging if needed

export function useDreamManagement() {
  // console.log('[useDreamManagement] Function executed'); // Keep for debugging if needed
  const tagStore = useTagStore()
  const confirm = useConfirm()
  const toast = useToast()
  const { trackError, trackUserAction, trackPerformance } = useErrorTracking()

  const {
    data: savedDreams,
    pending,
    error,
    refresh: refreshDreamsListAPI,
  } = useFetch<DreamSummary[]>('/api/dreams', {
    lazy: true,
    default: () => [],
    watch: [],
    immediate: false, // Explicitly prevent immediate fetch
    key: 'global-dreams-list', // Key for Nuxt to deduplicate this fetch
  })

  // console.log('[useDreamManagement] Instance: useFetch for /api/dreams set up with key global-dreams-list.'); // Keep for debugging

  // --- State for dreams list ---
  const isDreamsOpen = ref(false)

  // Watch for changes and save to localStorage
  watch(isDreamsOpen, (newValue) => {
    localStorage.setItem('dreamsListOpen', String(newValue))
  })
  // -----------------------------

  // --- Inject refresh function into the store & load localStorage state for isDreamsOpen ---
  onMounted(() => {
    // console.log('[useDreamManagement] onMounted hook executed.'); // Keep for debugging
    if (refreshDreamsListAPI) {
      tagStore.setDreamsListRefresher(refreshDreamsListAPI) // Set refresher in store
      // console.log('[useDreamManagement] onMounted: dreamsListFetched is currently', dreamsListFetched); // Keep for debugging
      if (!dreamsListFetched) {
        // console.log('[useDreamManagement] onMounted: Fetching dreams list (keyed instance) because dreamsListFetched is false.'); // Keep for debugging
        dreamsListFetched = true
        // console.log('[useDreamManagement] onMounted: dreamsListFetched set to true.'); // Keep for debugging
        refreshDreamsListAPI() // Call refresh only on the first mount globally
      } else {
        // console.log('[useDreamManagement] onMounted: Skipping dreams list fetch because dreamsListFetched is true.'); // Keep for debugging
      }
    }
    const storedState = localStorage.getItem('dreamsListOpen')
    isDreamsOpen.value = storedState === 'true'
  })
  // ------------------------------------------------------------------------------------

  // --- Dream Actions Menu & Inline Editing State ---
  const selectedDreamForMenu = ref<DreamSummary | null>(null) // Tracks which dream's menu is targeted
  const editingDreamId = ref<number | null>(null)
  const editingTitle = ref('')

  const menuItems = ref([
    {
      label: 'Rename',
      icon: 'pi pi-pencil',
      command: () => {
        if (selectedDreamForMenu.value) {
          startEditingDreamTitle(selectedDreamForMenu.value)
        }
      },
    },
    // Future actions: Delete, Duplicate, etc.
  ])
  // ----------------------------------------------

  // --- Functions for Menu and Inline Editing ---
  function toggleDreamActionMenu(
    event: MouseEvent,
    dream: DreamSummary,
    menuComponent: { toggle: (event: MouseEvent) => void }
  ) {
    selectedDreamForMenu.value = dream // Set context for menu items
    if (menuComponent && typeof menuComponent.toggle === 'function') {
      menuComponent.toggle(event)
    } else {
      console.warn('Menu component or toggle function not provided to toggleDreamActionMenu')
    }
  }

  function startEditingDreamTitle(dream: DreamSummary) {
    editingDreamId.value = dream.id
    editingTitle.value = dream.title || ''
    trackUserAction('start_edit_dream_title', 'dream', { dreamId: dream.id })
  }

  async function saveDreamTitle(dream: DreamSummary) {
    if (editingDreamId.value === null || !dream) return
    const originalTitle = dream.title
    const newTitle = editingTitle.value.trim()

    if (!newTitle) {
      toast.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Title cannot be empty.',
        life: 3000,
      })
      editingTitle.value = originalTitle || ''
      return
    }

    if (newTitle === originalTitle) {
      editingDreamId.value = null
      editingTitle.value = ''
      return
    }

    const startTime = Date.now()
    try {
      const { data: updatedDreamData, error: fetchError } = await useFetch(
        `/api/dreams/${dream.id}`,
        {
          method: 'PUT',
          body: { title: newTitle },
          watch: false,
        }
      )

      const duration = Date.now() - startTime
      trackPerformance('update_dream_title', duration, { dreamId: dream.id })

      if (fetchError.value) {
        trackError(fetchError.value, 'Could not update dream title. Please try again.', {
          context: {
            dream: { id: dream.id, originalTitle, newTitle },
            operation: 'update_title',
          },
        })
      } else if (updatedDreamData.value) {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Dream title updated!',
          life: 3000,
        })
        trackUserAction('dream_title_updated', 'dream', {
          dreamId: dream.id,
          oldTitle: originalTitle,
          newTitle,
        })

        if (savedDreams.value) {
          const dreamInList = savedDreams.value.find((d) => d.id === dream.id)
          if (dreamInList) {
            dreamInList.title = (updatedDreamData.value as Dream).title
          }
        }
      }
    } catch (err) {
      trackError(
        err as Error,
        'Network error updating dream title. Please check your connection.',
        {
          context: {
            dream: { id: dream.id, originalTitle, newTitle },
            operation: 'update_title',
          },
        }
      )
    }

    editingDreamId.value = null
    editingTitle.value = ''
  }

  function cancelEditDreamTitle() {
    editingDreamId.value = null
    editingTitle.value = ''
  }
  // -----------------------------------------

  // --- Core Dream Operations ---
  function proceedWithLoad(dream: DreamSummary | null) {
    // Internal helper
    if (dream === null) {
      tagStore.resetToCurrentSession({ isNewDream: false })
    }
  }

  // Helper to unify unsaved changes confirmation
  async function confirmUnsavedChanges(
    message: string,
    acceptLabel: string,
    rejectLabel: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      confirm.require({
        message,
        header: 'Unsaved Changes',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel,
        rejectLabel,
        rejectClass: 'p-button-secondary p-button-outlined',
        accept: () => resolve(true),
        reject: () => resolve(false),
      })
    })
  }

  async function loadDream(dream: DreamSummary | null) {
    const targetDreamId = dream ? dream.id : null

    trackUserAction('load_dream_attempt', 'dream', {
      targetDreamId,
      hasUnsavedChanges: tagStore.hasUnsavedChanges,
    })

    if (tagStore.hasUnsavedChanges && tagStore.loadedDreamId !== targetDreamId) {
      const shouldSave = await confirmUnsavedChanges(
        'You have unsaved changes. Do you want to save them before loading the new dream?',
        'Save & Load',
        'Load Without Saving'
      )
      if (shouldSave) {
        console.warn(
          'Programmatic saving before load not implemented in composable. Loading without saving.'
        )
      }
      proceedWithLoad(dream)
    } else {
      proceedWithLoad(dream)
    }
  }

  async function handleAddNewDream() {
    trackUserAction('new_dream_attempt', 'dream', {
      hasUnsavedChanges: tagStore.hasUnsavedChanges,
    })

    const performReset = () => {
      tagStore.resetToCurrentSession({ isNewDream: true }) // Explicitly a new dream
      isDreamsOpen.value = true
      trackUserAction('new_dream_created', 'dream', {})
    }

    if (tagStore.hasUnsavedChanges) {
      const shouldSave = await confirmUnsavedChanges(
        'You have unsaved changes. Do you want to save them before starting a new dream?',
        'Save & Start New',
        'Start New Without Saving'
      )
      if (shouldSave) {
        console.warn(
          'Programmatic saving before new dream not implemented in composable. Starting new without saving.'
        )
      }
      performReset()
    } else {
      performReset()
    }
  }
  // --------------------------

  // --- Save Dream Operations ---
  const isSavingDream = ref(false) // Add a ref to track saving state if needed by other parts of the composable or UI

  // Helper function to handle save errors (can be used by multiple save operations)
  function handleSaveError(error: unknown, operation: string) {
    let errorMessage = `Could not ${operation} dream due to an unknown error.`
    const errorContext: { operation: string; validationErrors?: ValidationError[] } = {
      operation,
    }
    let errorToTrack: Error | unknown = error

    if (
      error instanceof Object &&
      'data' in error &&
      error.data &&
      typeof error.data === 'object'
    ) {
      const errorData = error.data as {
        message?: string
        code?: string
        errors?: ValidationError[]
      }
      errorMessage = errorData.message || errorMessage
      if (errorData.code === 'VALIDATION_FAILED' && Array.isArray(errorData.errors)) {
        errorContext.validationErrors = errorData.errors
        if (errorContext.validationErrors) {
          errorMessage = errorContext.validationErrors
            .map((e) => `${e.field}: ${e.message}`)
            .join('; ')
        }
      }
    } else if (error instanceof Object && 'statusMessage' in error) {
      errorMessage = (error as { statusMessage: string }).statusMessage
    }

    if (!(error instanceof Error)) {
      errorToTrack = new Error(errorMessage)
    }

    trackError(errorToTrack as Error, errorMessage, {
      context: {
        dreamOperation: errorContext,
        status: error instanceof Object && 'status' in error ? error.status : 'unknown',
      },
    })
  }

  // Function to perform the save (for new or save as new)
  async function performSaveAsNew(
    dreamDataPayload: { tags: Tag[] },
    tagStoreInstance: ReturnType<typeof useTagStore>,
    lastUsedModelId?: string
  ) {
    // Pass toast and tagStore
    isSavingDream.value = true
    const startTime = Date.now()
    let newDreamResponse = null

    trackUserAction('save_dream_start', 'dream', {
      isNew: true,
      tagCount: dreamDataPayload.tags?.length || 0,
    })

    try {
      newDreamResponse = await $fetch<Dream>('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dreamDataPayload,
          lastUsedModelId: lastUsedModelId, // Include the model ID
          // title: title, // Title handling can be more complex if it's part of the payload vs. separate logic
        }),
      })

      const duration = Date.now() - startTime
      trackPerformance('save_new_dream', duration, {
        dreamId: newDreamResponse.id,
        tagCount: dreamDataPayload.tags?.length || 0,
      })

      console.log('New dream saved successfully via composable:', newDreamResponse)

      trackUserAction('dream_saved', 'dream', {
        dreamId: newDreamResponse.id,
        isNew: true,
      })

      // IMPORTANT: Update store to reflect this newly saved dream as the current one
      // Use updateLoadedDreamId instead of loadDreamState to avoid triggering isRestoringSession
      // which would cause ForceGraph to reset positions
      tagStoreInstance.updateLoadedDreamId(newDreamResponse.id)
      tagStoreInstance.refreshDreamsList() // This should ideally call the refreshDreamsListAPI from this composable

      return newDreamResponse // Return the saved dream data
    } catch (error: unknown) {
      const duration = Date.now() - startTime
      trackPerformance('save_new_dream', duration, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })

      handleSaveError(error, 'save as new')
      return null // Indicate failure
    } finally {
      isSavingDream.value = false
    }
  }

  async function initiateSaveDreamProcess(dreamDataPayload: { tags: Tag[] }, lastUsedModelId?: string) {
    console.log(`[DREAM_SAVE] === STARTING SAVE PROCESS ===`)
    console.log(`[DREAM_SAVE] isSavingDream.value: ${isSavingDream.value}`)
    console.log(`[DREAM_SAVE] dreamDataPayload:`, dreamDataPayload)

    const transformedInPayload = dreamDataPayload.tags?.filter((tag) => tag.isTransformed) || []
    console.log(`[DREAM_SAVE] Transformed tags in payload: ${transformedInPayload.length}`)
    transformedInPayload.forEach((tag) => {
      console.log(
        `[DREAM_SAVE] Payload transformed tag: ${tag.id} - "${tag.originalText}" -> "${tag.text}"`
      )
    })

    if (isSavingDream.value) return // Prevent multiple saves

    const currentLoadedDreamId = tagStore.loadedDreamId // Get current dream ID from store
    console.log(`[DREAM_SAVE] currentLoadedDreamId: ${currentLoadedDreamId}`)

    trackUserAction('save_dream_initiated', 'dream', {
      dreamId: currentLoadedDreamId,
      tagCount: dreamDataPayload.tags?.length || 0,
      hasTransformedTags: transformedInPayload.length > 0,
    })

    if (currentLoadedDreamId !== null) {
      confirm.require({
        message: 'This dream already exists. How would you like to save your changes?',
        header: 'Confirm Save Action',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Update Existing',
        rejectLabel: 'Save as New Dream',
        rejectClass: 'p-button-secondary p-button-outlined',
        accept: async () => {
          isSavingDream.value = true
          const startTime = Date.now()

          trackUserAction('update_dream_start', 'dream', {
            dreamId: currentLoadedDreamId,
          })

          try {
            // NOTE: The API endpoint and method for update might need adjustment.
            // Current TagCloud.vue uses POST to /api/dreams with dreamIdToUpdate in body.
            // A more RESTful approach would be PUT to /api/dreams/:id.
            // Assuming the current backend handles the POST for updates.
            const updatedDream = await $fetch<Dream>('/api/dreams', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dreamIdToUpdate: currentLoadedDreamId,
                data: dreamDataPayload,
                lastUsedModelId: lastUsedModelId, // Include the model ID for updates too
              }),
            })

            const duration = Date.now() - startTime
            trackPerformance('update_dream', duration, {
              dreamId: currentLoadedDreamId,
            })

            console.log('Dream updated successfully via composable:', updatedDream)
            toast.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Dream updated successfully!',
              life: 3000,
            })

            trackUserAction('dream_updated', 'dream', {
              dreamId: currentLoadedDreamId,
            })

            tagStore.markAsSaved()
            if (refreshDreamsListAPI) refreshDreamsListAPI() // Refresh using the composable's own refresher
          } catch (error: unknown) {
            const duration = Date.now() - startTime
            trackPerformance('update_dream', duration, {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            })

            handleSaveError(error, 'update') // Use existing error handler
          } finally {
            isSavingDream.value = false
          }
        },
        reject: async () => {
          // User chose to SAVE AS NEW dream (from an existing one)
          // performSaveAsNew already sets isSavingDream true/false
          await performSaveAsNew(dreamDataPayload, tagStore, lastUsedModelId)
        },
      })
    } else {
      // It's a NEW dream (loadedDreamId is null), save it directly
      // performSaveAsNew already sets isSavingDream true/false
      await performSaveAsNew(dreamDataPayload, tagStore, lastUsedModelId)
    }
  }
  // --------------------------

  return {
    // State
    isDreamsOpen,
    savedDreams,
    pending,
    error,
    menuItems, // For the Menu component
    selectedDreamForMenu,
    editingDreamId,
    editingTitle,
    isSavingDream, // Expose if needed externally

    // Functions
    refreshDreamsListAPI, // Expose the refresh function from useFetch
    handleAddNewDream,
    loadDream,
    toggleDreamActionMenu,
    startEditingDreamTitle,
    saveDreamTitle,
    cancelEditDreamTitle,
    performSaveAsNew, // EXPORT
    initiateSaveDreamProcess, // EXPORT NEW FUNCTION
    // handleSaveError is internal to the composable but used by performSaveAsNew
  }
}
