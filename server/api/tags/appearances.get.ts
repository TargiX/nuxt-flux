import { defineEventHandler } from 'h3'
import prisma from '~/server/utils/db'

export default defineEventHandler(async () => {
  try {
    const appearances = await prisma.tagAppearance.findMany()
    return appearances
  } catch (error) {
    console.error('Error fetching tag appearances:', error)
    // This will be caught by the global error handler
    throw new Error('Could not fetch tag appearances')
  }
})
