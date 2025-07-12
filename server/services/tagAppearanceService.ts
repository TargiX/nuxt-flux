import prisma from '~/server/utils/db'
import { generateImage } from '~/server/services/aiImageGenerator'
import { uploadImage } from '~/server/utils/storage'
// Using console.* for logging

/**
 * Generates and saves an icon for a given tag if it doesn't already exist.
 * @param tagAlias The alias of the tag (e.g., "mythical-creatures").
 * @param displayText The display text of the tag (e.g., "Mythical Creatures"). If not provided, uses tagAlias.
 * @returns An object indicating success and the URL of the new icon or a message.
 * @throws An error if any step of the process fails.
 */
export async function generateIconForTag(
  tagAlias: string,
  displayText?: string
): Promise<{ success: true; imageUrl?: string; message?: string }> {
  const promptText = displayText || tagAlias.replace(/-/g, ' ')
  console.log(`[TagIcon] Starting generation process for alias: "${tagAlias}" with display text: "${promptText}"`)

  // 1. Check if an appearance already exists
  const existingAppearance = await prisma.tagAppearance.findUnique({
    where: { id: tagAlias },
  })

  if (existingAppearance) {
    console.log(`[TagIcon] Icon for alias "${tagAlias}" already exists. Skipping generation.`)
    return { success: true, message: 'Icon already exists for this tag.' }
  }

  // 2. Generate a specialized prompt using the display text
  const prompt = `a minimalist vector icon for '${promptText}', vibrant colors, on a dark background, clean design, high contrast`
  console.log(`[TagIcon] Generating image for alias "${tagAlias}" with prompt: "${prompt}"`)

  // 3. Generate the image
  const generationResult = await generateImage(prompt, 'gemini-2.0-flash-preview-image-generation', { size: '256x256' })
  if (!generationResult.imageBase64) {
    console.error(
      `[TagIcon] Image generation failed for alias "${tagAlias}". No base64 data returned.`
    )
    throw new Error('Image generation failed to return a base64 string.')
  }
  console.log(`[TagIcon] Image successfully generated for alias "${tagAlias}".`)

  // 4. Convert base64 to Buffer and upload
  const base64Data = generationResult.imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  console.log(`[TagIcon] Uploading image to storage for alias "${tagAlias}".`)
  const imageUrl = await uploadImage(buffer, `${tagAlias}.png`, 'tag-icons')
  console.log(`[TagIcon] Image uploaded for alias "${tagAlias}". URL: ${imageUrl}`)

  // 5. Save the new appearance to the database
  console.log(`[TagIcon] Saving appearance to database for alias "${tagAlias}".`)
  await prisma.tagAppearance.create({
    data: {
      id: tagAlias,
      imageUrl,
    },
  })
  console.log(`[TagIcon] Appearance saved successfully for alias "${tagAlias}".`)

  return { success: true, imageUrl }
}
