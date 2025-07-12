import prisma from '~/server/utils/db'
import { generateImage } from '~/server/services/aiImageGenerator'
import { uploadImage } from '~/server/utils/storage'
import logger from '~/utils/logger'

/**
 * Generates and saves an icon for a given tag if it doesn't already exist.
 * @param tagName The name of the tag (e.g., "Mythical Creatures").
 * @returns An object indicating success and the URL of the new icon or a message.
 * @throws An error if any step of the process fails.
 */
export async function generateIconForTag(
  tagName: string
): Promise<{ success: true; imageUrl?: string; message?: string }> {
  const tagAlias = tagName.toLowerCase().replace(/\s+/g, '-')
  logger.info(`[TagIcon] Starting generation process for tag: "${tagName}" (alias: ${tagAlias})`)

  // 1. Check if an appearance already exists
  const existingAppearance = await prisma.tagAppearance.findUnique({
    where: { id: tagAlias },
  })

  if (existingAppearance) {
    logger.info(`[TagIcon] Icon for alias "${tagAlias}" already exists. Skipping generation.`)
    return { success: true, message: 'Icon already exists for this tag.' }
  }

  // 2. Generate a specialized prompt
  const prompt = `a minimalist vector icon for '${tagName}', vibrant colors, on a dark background, clean design, high contrast`
  logger.info(`[TagIcon] Generating image for alias "${tagAlias}" with prompt: "${prompt}"`)

  // 3. Generate the image
  const generationResult = await generateImage(prompt, 'gemini-flash', { size: '256x256' })
  if (!generationResult.imageBase64) {
    logger.error(
      `[TagIcon] Image generation failed for alias "${tagAlias}". No base64 data returned.`
    )
    throw new Error('Image generation failed to return a base64 string.')
  }
  logger.info(`[TagIcon] Image successfully generated for alias "${tagAlias}".`)

  // 4. Convert base64 to Buffer and upload
  const base64Data = generationResult.imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  logger.info(`[TagIcon] Uploading image to storage for alias "${tagAlias}".`)
  const imageUrl = await uploadImage(buffer, `${tagAlias}.png`, 'tag-icons')
  logger.info(`[TagIcon] Image uploaded for alias "${tagAlias}". URL: ${imageUrl}`)

  // 5. Save the new appearance to the database
  logger.info(`[TagIcon] Saving appearance to database for alias "${tagAlias}".`)
  await prisma.tagAppearance.create({
    data: {
      id: tagAlias,
      imageUrl,
    },
  })
  logger.info(`[TagIcon] Appearance saved successfully for alias "${tagAlias}".`)

  return { success: true, imageUrl }
}
