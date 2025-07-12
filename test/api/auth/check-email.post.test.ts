import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

import prisma from '~/server/utils/db'

// Mock dependencies
vi.mock('~/server/utils/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}))

describe('POST /api/auth/check-email', () => {
  setup({ server: true })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return { available: true } if email is not registered', async () => {
    // Arrange
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    // Act
    const response = await $fetch('/api/auth/check-email', {
      method: 'POST',
      body: { email: 'new@example.com' },
    })

    // Assert
    expect(response).toEqual({ available: true })
  })

  it('should return 409 conflict if email is already registered', async () => {
    // Arrange
    const existingUser = {
      id: 'user-1',
      email: 'existing@example.com',
      name: 'Existing User',
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null,
      image: null,
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)

    // Act & Assert
    await expect(
      $fetch('/api/auth/check-email', {
        method: 'POST',
        body: { email: 'existing@example.com' },
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 409,
        statusMessage: 'Email already registered',
      })
    )
  })

  it('should return 400 if email is not provided', async () => {
    // Act & Assert
    await expect(
      $fetch('/api/auth/check-email', {
        method: 'POST',
        body: {},
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Email is required',
      })
    )
  })
})
