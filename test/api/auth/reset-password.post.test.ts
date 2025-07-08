import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import bcrypt from 'bcrypt'

// Mock dependencies
vi.mock('~/server/utils/db', () => ({
  default: {
    passwordResetToken: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  },
}))

import prisma from '~/server/utils/db'

describe('POST /api/auth/reset-password', () => {
  setup({ server: true })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  type PasswordResetToken = {
    id: string
    tokenHash: string
    userId: string
    expiresAt: Date
    createdAt: Date
  }

  let validToken: string, hashedToken: string, validTokenRecord: PasswordResetToken

  beforeAll(async () => {
    validToken = 'valid-token'
    hashedToken = await bcrypt.hash(validToken, 10)
    validTokenRecord = {
      id: 'token-1',
      tokenHash: hashedToken,
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
    }
  })

  it('should reset password successfully with a valid token', async () => {
    // Arrange
    const mockUpdatedUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      passwordHash: 'new-hashed-password',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null,
      image: null,
    }
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([validTokenRecord])
    vi.mocked(prisma.user.update).mockResolvedValue(mockUpdatedUser)

    // Act
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token: validToken, password: 'new-password-123' },
    })

    // Assert
    expect(response.message).toBe('Password has been reset successfully.')
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: validTokenRecord.userId },
      data: { passwordHash: expect.any(String) },
    })
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: validTokenRecord.userId },
    })
  })

  it('should throw 400 for an invalid token', async () => {
    // Arrange
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([validTokenRecord])

    // Act & Assert
    await expect(
      $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { token: 'invalid-token', password: 'new-password-123' },
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Invalid or expired password reset token.',
      })
    )
  })

  it('should throw 400 for an expired token', async () => {
    // Arrange
    const expiredTokenRecord = {
      ...validTokenRecord,
      expiresAt: new Date(Date.now() - 1000),
    }
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([expiredTokenRecord])

    // Act & Assert
    await expect(
      $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { token: validToken, password: 'new-password-123' },
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Invalid or expired password reset token.',
      })
    )
  })

  it('should throw 400 if password is too short', async () => {
    // Act & Assert
    await expect(
      $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { token: validToken, password: 'short' },
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Password must be at least 8 characters long.',
      })
    )
  })

  it('should throw 400 if token is not provided', async () => {
    // Act & Assert
    await expect(
      $fetch('/api/auth/reset-password', {
        method: 'POST',
        body: { password: 'new-password-123' },
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Invalid token or password provided.',
      })
    )
  })
})
