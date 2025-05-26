import { PrismaClient } from '@prisma/client'

const prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : (globalThis.__prisma ??= new PrismaClient())

export default prisma