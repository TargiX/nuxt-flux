import { hash } from 'bcrypt'
import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get request body
    const body = await readBody(event)
    const { email, password, name } = body

    // Basic validation
    if (!email || !password) {
      return createError({
        statusCode: 400,
        statusMessage: 'Email and password are required',
      })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return createError({
        statusCode: 400,
        statusMessage: 'User with this email already exists',
      })
    }

    // Hash password (cost factor of 10)
    const passwordHash = await hash(password, 10)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
      // Don't return the hashed password!
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    // Return the created user (without password)
    return { user }
  } catch (error) {
    // Log the error for debugging
    console.error('Registration error:', error)

    // Return a generic error to the client
    return createError({
      statusCode: 500,
      statusMessage: 'An error occurred during registration',
    })
  }
})
