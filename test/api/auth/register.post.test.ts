import { describe, it, expect, vi } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'
import { hash } from 'bcrypt'

import prisma from '~/server/utils/db'

// Mock the prisma client
vi.mock('~/server/utils/db', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

describe('POST /api/auth/register', () => {
  setup({
    // Set up the server for testing
    server: true,
  })

  it('should register a new user successfully', async () => {
    // Arrange
    const password = 'password123'
    const passwordHash = await hash(password, 10)
    const userData = {
      email: 'test@example.com',
      password,
      name: 'Test User',
    }
    const createdUser = {
      id: '1',
      email: userData.email,
      name: userData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null,
      image: null,
      passwordHash,
    }

    // Mock prisma calls
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue(createdUser)

    // Act
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: userData,
    })

    // Assert
    const body = response as { user: { email: string; name: string } }
    expect(body.user).toBeDefined()
    expect(body.user.email).toBe(userData.email)
    expect(body.user.name).toBe(userData.name)
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash: expect.any(String),
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })
  })

  it('should return 400 if email already exists', async () => {
    // Arrange
    const userData = {
      email: 'existing@example.com',
      password: 'password123',
      name: 'Existing User',
    }
    const existingUser = {
      id: '2',
      email: userData.email,
      name: userData.name,
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: null,
      image: null,
    }
    vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser)

    // Act & Assert
    await expect(
      $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'User with this email already exists',
      })
    )
  })

  it('should return 400 if email is not provided', async () => {
    // Arrange
    const userData = {
      password: 'password123',
      name: 'Test User',
    }

    // Act & Assert
    await expect(
      $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Email and password are required',
      })
    )
  })

  it('should return 400 if password is not provided', async () => {
    // Arrange
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
    }

    // Act & Assert
    await expect(
      $fetch('/api/auth/register', {
        method: 'POST',
        body: userData,
      })
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'Email and password are required',
      })
    )
  })
})
