import { PrismaClient } from '@prisma/client'

declare global {
  var __prisma: PrismaClient | undefined
}

// reuse global instance in dev
const prisma = process.env.NODE_ENV === 'production'
  ? new PrismaClient()
  : (globalThis.__prisma ??= new PrismaClient())

export default prisma