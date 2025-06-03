// import { GoogleGenerativeAI } from '@google/generative-ai'; // Removed SDK import
import type { Tag } from '~/types/tag';
import { callGeminiAPI } from '~/utils/api'; // Import the helper
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

export async function generateRelatedTags(
  parentTag: Tag,
  existingTags: Tag[],
  ancestorChain: Tag[] // New parameter for ancestor tags
  // apiKey: string // Removed apiKey parameter
): Promise<Tag[]> {
  // Refined logic for existingTexts:
  // We want to avoid suggesting the parentTag itself, and its direct predefined children.
  let textsToAvoid: string[] = [parentTag.text.toLowerCase()];
  
  if (parentTag.children && parentTag.children.length > 0) {
    const predefinedChildTexts = parentTag.children
      .filter(child => !child.id.includes('-dyn-')) // Ensure they are predefined children
      .map(child => child.text.toLowerCase());
    textsToAvoid = [...textsToAvoid, ...predefinedChildTexts];
  }
  
  // Remove duplicates just in case, though unlikely with current structure
  const existingTexts = [...new Set(textsToAvoid)];

  let pathContext = `The user selected \"${parentTag.text}\" as their main subject in the \"${parentTag.zone}\" zone.`;
  if (ancestorChain && ancestorChain.length > 0) {
    const ancestorPath = ancestorChain.map(a => a.text).join(' -> ');
    pathContext = `The user is exploring the path: ${ancestorPath} -> \"${parentTag.text}\" (current selection) in the \"${parentTag.zone}\" zone.`
  }

  // Construct the prompt as a discovery journey
  const generationPrompt = `${pathContext}

Looking at this exploration path, I need to suggest 6 subcategories that logically drill deeper into "${parentTag.text}". 

Based on the full context path (${ancestorChain.length ? ancestorChain.map(a => a.text).join(' > ') + ' > ' : ''}${parentTag.text}), suggest specific subtypes, variants, or specializations within "${parentTag.text}" that would be the natural next level of detail.

Requirements:
- Each suggestion should be 1-2 words, with each word capitalized
- Avoid these existing tags: ${existingTexts.join(', ')}
- Stay within the semantic domain established by the path
- Think about what someone would logically want to explore next within "${parentTag.text}"

Return only a JSON array of strings. Examples:
- For "Vehicles": ["Car", "Truck", "Motorcycle", "Bus", "Bicycle", "Van"]
- For "Businessman": ["CEO", "Manager", "Entrepreneur", "Consultant", "Executive", "Director"]
- For "Trees": ["Oak", "Pine", "Maple", "Birch", "Willow", "Cedar"]`;

  // Define generation config
  const generationConfig = {
    temperature: 1,
    maxOutputTokens: 200,
    modelName: 'gemini-2.0-flash-lite' // Specify the model for this specific task
  };

  try {
    // Call the backend proxy API using the helper
    const response = await callGeminiAPI({
      prompt: generationPrompt,
      ...generationConfig,
    });

    const rawText = response.generatedText;

    // Parse the JSON response from the generated text
    const cleanedText = rawText.replace(/```json\n|\n```/g, '').trim();
    // Add a try-catch for JSON parsing for robustness
    let newTagsText: string[];
    try {
      newTagsText = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', cleanedText, parseError);
      throw new Error('Invalid JSON response received from AI for tag generation.');
    }

    // Map to Tag objects, using UUID for ID
    return newTagsText.map((text: string): Tag => ({
      id: `${parentTag.id}-dyn-${uuidv4()}`,
      text,
      size: 40,
      selected: false,
      zone: parentTag.zone,
      alias: text.toLowerCase().replace(/\s+/g, '-'),
      parentId: parentTag.id,
      x: parentTag.x,
      y: parentTag.y,
      isLoading: false,
      children: [],
      depth: (parentTag.depth ?? 0) + 1
    }));
  } catch (error) {
    console.error('Error generating related tags via API:', error);
    // Re-throw or return an empty array depending on desired error handling
    // return [];
    throw error;
  }
} 