import pkg from '@prisma/client'
import type { PrismaClient as PrismaClientType } from '@prisma/client'
const { PrismaClient } = pkg

declare global {
  var __prisma: PrismaClientType | undefined
}

// reuse global instance in dev
const prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : (globalThis.__prisma ??= new PrismaClient())

export default prisma
