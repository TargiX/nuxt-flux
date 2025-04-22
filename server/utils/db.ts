import { PrismaClient } from '@prisma/client'

// Simplify for potential build issue diagnosis
// Remove the singleton logic for now

// declare global {
//   // eslint-disable-next-line no-var
//   var __prisma: PrismaClient | undefined
// }

const prisma = new PrismaClient()

// if (process.env.NODE_ENV === 'production') {
//   prisma = new PrismaClient()
// } else {
//   if (!global.__prisma) {
//     global.__prisma = new PrismaClient()
//   }
//   prisma = global.__prisma
// }

export default prisma 