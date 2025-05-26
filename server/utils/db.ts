// CJS bundle converted by @rollup/plugin-commonjs → default export
import prismaClientPkg from '~/generated/prisma/client'

const { PrismaClient } =
  // after common-js transform everything lives on the default object
  (prismaClientPkg as any).PrismaClient
    ? (prismaClientPkg as any)
    : (prismaClientPkg as any).default

const prisma =
  process.env.NODE_ENV === 'production'
    ? new PrismaClient()
    : (globalThis.__prisma ??= new PrismaClient())

export default prisma
