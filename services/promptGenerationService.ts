import { callGeminiAPI } from '~/utils/api';

/**
 * Generates an image prompt based on selected tags using the backend API.
 * @param selectedTagsString - A string containing the selected tags (e.g., "Tag1, Tag2").
 * @returns The generated image prompt string.
 */
export async function generateImagePrompt(selectedTagsString: string): Promise<string> {
  if (!selectedTagsString || selectedTagsString.trim().length === 0) {
    console.warn('generateImagePrompt called with empty tags string.');
    return ''; // Return empty if no tags are provided
  }

  const generationPrompt = `You are creating an image prompt based on the following tags: ${selectedTagsString}. You should create prompt as much exactly matching the tags as possible, based on the tags but transformed into a prompt for an image generator, the result is a prompt for an image generator, no words before, no words after, just the prompt.`;

  // Define generation config for this specific task
  const generationConfig = {
    temperature: 0.5,
    maxOutputTokens: 1000,
    modelName: 'gemini-2.0-flash-lite' // Or specify another model if needed
  };

  try {
    const response = await callGeminiAPI({
      prompt: generationPrompt,
      ...generationConfig,
    });
    return response.generatedText;
  } catch (error) {
    console.error('Error generating image prompt via API:', error);
    // Depending on requirements, you might return a fallback prompt or re-throw
    // return `Failed to generate prompt for: ${selectedTagsString}`; 
    throw error;
  }
} 