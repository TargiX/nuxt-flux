import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    // Get email from request body
    const { email } = await readBody(event)

    // Basic validation
    if (!email) {
      return createError({
        statusCode: 400,
        statusMessage: 'Email is required',
      })
    }

    // Check if user with this email exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }, // Only need to know if it exists, not full user data
    })

    if (existingUser) {
      // Return conflict error if user exists
      return createError({
        statusCode: 409, // Conflict - resource already exists
        statusMessage: 'Email already registered',
      })
    }

    // Email is available
    return { available: true }
  } catch (error) {
    // Log error for debugging
    console.error('Email check error:', error)

    // Return generic error
    return createError({
      statusCode: 500,
      statusMessage: 'Error checking email availability',
    })
  }
})
