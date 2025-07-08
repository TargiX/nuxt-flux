import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDreamManagement } from '~/composables/useDreamManagement'
import { setActivePinia, createPinia } from 'pinia'

// Mock dependencies
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn(),
  }),
}))

vi.mock('~/composables/useErrorTracking', () => ({
  useErrorTracking: () => ({
    trackError: vi.fn(),
    trackUserAction: vi.fn(),
    trackPerformance: vi.fn(),
  }),
}))

// Mock useFetch
const useFetchMock = vi.fn()
vi.mock('#imports', () => ({
  useFetch: (request: string, options: Record<string, unknown>) => {
    // This allows us to chain the mock setup
    return useFetchMock(request, options)
  },
}))

describe('useDreamManagement', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('saveDreamTitle', () => {
    it('should update a dream title successfully', async () => {
      // Arrange
      const { saveDreamTitle, editingDreamId, editingTitle, savedDreams } = useDreamManagement()
      const dream = { id: 1, title: 'Old Title', createdAt: new Date().toISOString() }
      savedDreams.value = [dream]
      editingDreamId.value = 1
      editingTitle.value = 'New Title'

      useFetchMock.mockReturnValue({
        data: { value: { ...dream, title: 'New Title' } },
        error: { value: null },
      })

      // Act
      await saveDreamTitle(dream)

      // Assert
      expect(useFetchMock).toHaveBeenCalledWith('/api/dreams/1', {
        method: 'PUT',
        body: { title: 'New Title' },
        watch: false,
      })
      expect(savedDreams.value[0].title).toBe('New Title')
      expect(editingDreamId.value).toBeNull()
    })

    it('should show a toast and not update if the new title is empty', async () => {
      // Arrange
      const { saveDreamTitle, editingDreamId, editingTitle, savedDreams } = useDreamManagement()
      const dream = { id: 1, title: 'Old Title', createdAt: new Date().toISOString() }
      savedDreams.value = [dream]
      editingDreamId.value = 1
      editingTitle.value = ' ' // Empty title

      // Act
      await saveDreamTitle(dream)

      // Assert
      expect(useFetchMock).not.toHaveBeenCalled()
      expect(savedDreams.value[0].title).toBe('Old Title')
      expect(editingDreamId.value).toBe(1) // Should not reset
    })

    it('should handle API errors gracefully', async () => {
      // Arrange
      const { saveDreamTitle, editingDreamId, editingTitle, savedDreams } = useDreamManagement()
      const dream = { id: 1, title: 'Old Title', createdAt: new Date().toISOString() }
      savedDreams.value = [dream]
      editingDreamId.value = 1
      editingTitle.value = 'New Title'

      const apiError = new Error('API Error')
      useFetchMock.mockReturnValue({
        data: { value: null },
        error: { value: apiError },
      })

      // Act
      await saveDreamTitle(dream)

      // Assert
      expect(savedDreams.value[0].title).toBe('Old Title') // Title should not change
      expect(editingDreamId.value).toBeNull() // Should reset even on error
    })
  })
})
