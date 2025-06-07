import { describe, it, expect } from 'vitest'
import { initializeTags, getAvailableZones } from '../../services/tagProcessingService'

// Basic unit tests for tagProcessingService

describe('tagProcessingService', () => {
  it('initializes tags with default zones', () => {
    const tags = initializeTags()
    expect(Array.isArray(tags)).toBe(true)
    expect(tags.length).toBeGreaterThan(0)
  })

  it('returns available zones', () => {
    const zones = getAvailableZones()
    expect(zones.length).toBeGreaterThan(0)
  })
})
