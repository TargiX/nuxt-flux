// Client-side service for generating image prompts via server endpoint

// In-memory cache for generated prompts to avoid redundant API calls
const promptCache = new Map<string, string>()

/**
 * Clears the cached prompt for a given tag string.
 */
export function clearPromptCache(selectedTagsString: string): void {
  const tags = selectedTagsString
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  const cacheKey = tags.join(', ')
  promptCache.delete(cacheKey)
}

/**
 * Generates an image prompt based on selected tags using the backend API.
 * @param selectedTagsString - A string containing the selected tags (e.g., "Tag1, Tag2").
 * @returns The generated image prompt string.
 */
export async function generateImagePrompt(selectedTagsString: string): Promise<string> {
  // Normalize tags and define cache key
  const tags = selectedTagsString
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
  const cacheKey = tags.join(', ')
  // Return cached prompt if available
  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!
  }

  if (!selectedTagsString || selectedTagsString.trim().length === 0) {
    console.warn('generateImagePrompt called with empty tags string.')
    return ''
  }

  try {
    // Call server endpoint for prompt generation
    const response = await fetch('/api/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Prompt API Error (${response.status}): ${errText}`)
    }
    const data = (await response.json()) as { generatedText: string }
    const generated = data.generatedText
    // Cache generated prompt
    promptCache.set(cacheKey, generated)
    return generated
  } catch (error) {
    console.error('Error generating image prompt via server API:', error)
    throw error
  }
}
