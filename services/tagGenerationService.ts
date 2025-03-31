import { GoogleGenerativeAI } from '@google/generative-ai';
import { Tag } from '~/types/tag';

export async function generateRelatedTags(
  parentTag: Tag,
  existingTags: Tag[],
  apiKey: string
): Promise<Tag[]> {
  const existingTexts = existingTags
    .filter(t => t.zone === parentTag.zone)
    .map(t => t.text.toLowerCase());

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

  const prompt = `You are helping users find relevant tags for their image generation. 
When user selects "${parentTag.text}" as their main subject, suggest 6 additional descriptive tags.

Requirements:
- Each tag should be 1-2 words
- Always start with a capital letter
- Avoid duplicating these existing tags: ${existingTexts.join(', ')}
- Think about what users might want to achieve when they selected "${parentTag.text}"
- Include both common and creative but relevant associations
- Focus on visual and artistic aspects
- Suggest tags that would help create interesting image variations
- Keep tags concrete and imagery-focused

Return only a JSON array of strings, no explanation.
Example format: ["Mountain Peak", "Dense Forest", "Morning Mist"]`;

  try {
    const response = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 200
      }
    });

    const rawText = response.response.text();
    const cleanedText = rawText.replace(/```json\n|\n```/g, '').trim();
    const newTagsText = JSON.parse(cleanedText) as string[];

    return newTagsText.map((text: string, index: number): Tag => ({
      id: `${parentTag.id}-dyn-${index}`,
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
    console.error('Error fetching dynamic tags:', error);
    throw error;
  }
} 