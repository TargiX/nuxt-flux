import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { mailer } from '~/server/utils/mail'

// Mock dependencies
vi.mock('~/server/utils/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock('~/server/utils/mail', () => ({
  mailer: {
    sendPasswordResetEmail: vi.fn(),
  },
}))

import prisma from '~/server/utils/db'

describe('POST /api/auth/forgot-password', () => {
  setup({ server: true })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailVerified: null,
    image: null,
  }

  it('should return success message and send email if user exists', async () => {
    // Arrange
    vi.mocked(prisma.user.findUnique).mockResolvedValue(validUser)
    const mockToken = {
      id: 'token-1',
      tokenHash: 'hashed-token',
      userId: validUser.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    }
    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue(mockToken)

    // Act
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'test@example.com' },
    })

    // Assert
    expect(response.message).toContain('password reset link')
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: validUser.id },
    })
    expect(prisma.passwordResetToken.create).toHaveBeenCalled()
    expect(mailer.sendPasswordResetEmail).toHaveBeenCalled()
  })

  it('should return success message but not send email if user does not exist', async () => {
    // Arrange
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    // Act
    const response = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'nouser@example.com' },
    })

    // Assert
    expect(response.message).toContain('password reset link')
    expect(prisma.passwordResetToken.deleteMany).not.toHaveBeenCalled()
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled()
    expect(mailer.sendPasswordResetEmail).not.toHaveBeenCalled()
  })

  it('should throw 400 if email is not provided', async () => {
    // Act & Assert
    await expect(
      $fetch('/api/auth/forgot-password', {
        method: 'POST',
        body: {},
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Invalid email address provided.',
      })
    )
  })
})
