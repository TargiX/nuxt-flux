import prisma from '~/server/utils/db'
import { generateImage } from '~/server/services/aiImageGenerator'
import { uploadImage } from '~/server/utils/storage'

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

  // 1. Check if an appearance already exists
  const existingAppearance = await prisma.tagAppearance.findUnique({
    where: { id: tagAlias },
  })

  if (existingAppearance) {
    return { success: true, message: 'Icon already exists for this tag.' }
  }

  // 2. Generate a specialized prompt
  const prompt = `a minimalist vector icon for '${tagName}', vibrant colors, on a dark background, clean design, high contrast`

  // 3. Generate the image
  const generationResult = await generateImage(prompt, 'gemini-flash', { size: '256x256' })
  if (!generationResult.imageBase64) {
    throw new Error('Image generation failed to return a base64 string.')
  }

  // 4. Convert base64 to Buffer and upload
  const base64Data = generationResult.imageBase64.replace(/^data:image\/\w+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  const imageUrl = await uploadImage(buffer, `${tagAlias}.png`, 'tag-icons')

  // 5. Save the new appearance to the database
  await prisma.tagAppearance.create({
    data: {
      id: tagAlias,
      imageUrl,
    },
  })

  return { success: true, imageUrl }
}
