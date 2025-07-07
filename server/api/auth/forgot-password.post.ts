import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '~/server/utils/db'
import { mailer } from '../../utils/mail'
import { randomBytes } from 'node:crypto'
import bcrypt from 'bcrypt'

export default defineEventHandler(async (event) => {
  const { email } = await readBody(event)
  const runtimeConfig = useRuntimeConfig(event)

  if (!email || typeof email !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid email address provided.',
    })
  }

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (user) {
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    const token = randomBytes(32).toString('hex')
    const tokenHash = await bcrypt.hash(token, 10)

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    const resetLink = `${runtimeConfig.public.authJs.baseUrl}/reset-password?token=${token}`
    await mailer.sendPasswordResetEmail(email, resetLink)
  }

  return {
    message: 'If your email is in our system, you will receive a password reset link shortly.',
  }
})
