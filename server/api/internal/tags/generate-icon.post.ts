import { defineEventHandler, readBody, createError } from 'h3'
import { generateIconForTag } from '~/server/services/tagAppearanceService'
import { z } from 'zod'

const RequestBodySchema = z.object({
  tagName: z.string(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const validation = RequestBodySchema.safeParse(body)
  if (!validation.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body.',
      data: validation.error.errors,
    })
  }

  const { tagName } = validation.data

  try {
    const result = await generateIconForTag(tagName)
    return result
  } catch (error) {
    console.error(`Failed to generate icon for tag "${tagName}":`, error)
    if (error instanceof Error) {
      throw createError({
        statusCode: 500,
        statusMessage: `Failed to generate icon: ${error.message}`,
      })
    }
    throw createError({
      statusCode: 500,
      statusMessage: 'An unknown error occurred while generating the tag icon.',
    })
  }
})
