import { defineEventHandler, readBody, createError } from 'h3'
import { generateIconForTag } from '~/server/services/tagAppearanceService'
// Using console.* for logging

interface RequestBody {
  alias: string
  displayText?: string
}

export default defineEventHandler(async (event) => {
  console.log('[Internal TagIcon API] handler invoked at URL:', event.node.req.url)
  try {
    const { alias, displayText } = await readBody<RequestBody>(event)
    console.log(
      `[Internal TagIcon API] Received request to generate icon for alias: "${alias}" with display text: "${displayText || 'not provided'}"`
    )

    if (!alias) {
      console.warn('[Internal TagIcon API] Request received with missing alias.')
      throw createError({
        statusCode: 400,
        statusMessage: 'Tag alias is required.',
      })
    }

    // No need to await, let it run in the background
    generateIconForTag(alias, displayText).catch((err: unknown) => {
      console.error(`Background generation failed for tag '${alias}':`, err)
    })

    console.log(`[Internal TagIcon API] Triggered background generation for alias: "${alias}"`)
    return { success: true, message: `Icon generation triggered for ${alias}.` }
  } catch (error: unknown) {
    console.error('Error triggering icon generation:', error)
    // Don't rethrow to the client that triggered this,
    // as it's a background process. Just log it.
    return { success: false, message: 'Failed to trigger icon generation.' }
  }
})
