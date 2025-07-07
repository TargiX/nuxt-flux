import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/db'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody(event)

  if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid token or password provided.',
    })
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password must be at least 8 characters long.',
    })
  }

  // Note: This approach fetches all non-expired tokens and iterates through them.
  // This is secure but may be inefficient on sites with a very high number of
  // simultaneous password reset requests. For most applications, this is acceptable.
  const allTokens = await prisma.passwordResetToken.findMany({
    where: {
      expiresAt: {
        gt: new Date(),
      },
    },
  })

  let validTokenRecord = null
  for (const record of allTokens) {
    const isTokenValid = await bcrypt.compare(token, record.tokenHash)
    if (isTokenValid) {
      validTokenRecord = record
      break
    }
  }

  if (!validTokenRecord) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired password reset token.',
    })
  }

  // Hash the new password
  const newPasswordHash = await bcrypt.hash(password, 10)

  // Update the user's password
  await prisma.user.update({
    where: {
      id: validTokenRecord.userId,
    },
    data: {
      passwordHash: newPasswordHash,
    },
  })

  // Invalidate all reset tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: validTokenRecord.userId,
    },
  })

  return { message: 'Password has been reset successfully.' }
})
