import { defineEventHandler, readBody, createError } from 'h3'
import { generateIconForTag } from '~/server/services/tagAppearanceService'

interface RequestBody {
  alias: string
}

export default defineEventHandler(async (event) => {
  try {
    const { alias } = await readBody<RequestBody>(event)

    if (!alias) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Tag alias is required.',
      })
    }

    // No need to await, let it run in the background
    generateIconForTag(alias).catch((err) => {
      console.error(`[Internal API] Failed to generate icon for tag '${alias}':`, err)
    })

    return { success: true, message: `Icon generation triggered for ${alias}.` }
  } catch (error: unknown) {
    console.error('[Internal API] Error triggering icon generation:', error)
    // Don't rethrow to the client that triggered this,
    // as it's a background process. Just log it.
    return { success: false, message: 'Failed to trigger icon generation.' }
  }
})
