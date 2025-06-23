import { defineEventHandler, readBody, createError } from 'h3'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  }

  const { public: { GEMINI_API_KEY } } = useRuntimeConfig()
  if (!GEMINI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'Missing Gemini API Key configuration' })
  }

  const { text } = await readBody<{ text: string }>(event)
  if (!text || text.trim().length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'Missing or empty node text' })
  }
  
  // Sanitize the text input
  const sanitizedText = text.trim().substring(0, 100) // Limit to 100 chars for safety

  const prompt = `You are helping a user explore and expand the concept "${sanitizedText}" in a creative visual mind map for AI image generation.

Your role: Act as a creative storytelling assistant who helps users build rich, visual narratives by suggesting the next logical expansion paths for their concept.

CONTEXT: The user clicked on "${sanitizedText}" in their mind map and wants to explore deeper into this theme to create more detailed and compelling AI-generated images.

TASK: Suggest exactly 3-4 categories that represent the most natural and interesting directions to expand this concept. Each category should contain 3-4 specific, visual elements that:
- Are concrete and can be clearly visualized in an image
- Help tell a more complete story about "${sanitizedText}"
- Provide rich detail that would enhance AI image generation
- Represent different aspects/dimensions of the concept

EXPANSION FRAMEWORK:
1. **Types/Varieties** - Different kinds, styles, or subcategories
2. **Settings/Environments** - Where this concept naturally exists or appears
3. **Activities/Actions** - What happens with/to this concept
4. **Attributes/Characteristics** - Visual qualities, states, or properties
5. **Companions/Elements** - What commonly appears alongside this concept

EXAMPLES:
• "plant" → "Plant Types" [rose, oak tree, succulent], "Plant Habitats" [tropical rainforest, desert oasis, cottage garden], "Plant Lifecycle" [seedling sprouting, full bloom, autumn leaves]
• "warrior" → "Warrior Classes" [medieval knight, samurai master, viking berserker], "Combat Gear" [enchanted sword, steel armor, battle shield], "Battle Locations" [castle siege, mountain pass, ancient arena]
• "castle" → "Castle Styles" [medieval fortress, fairy tale palace, ruined tower], "Castle Rooms" [throne room, dungeon, library], "Castle Life" [royal feast, knight training, evening torchlight]

RULES:
- Focus on visual, concrete elements (avoid abstract concepts)
- Make items specific enough to generate detailed images
- Each item should feel natural and authentic to the concept
- Categories should cover different storytelling dimensions
- Think about what would make the most compelling visual content

Return ONLY valid JSON, no other text:
[{"category":"Category Name","items":["Specific Item 1","Specific Item 2","Specific Item 3"]}]`

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash-lite',
    generationConfig: {
      temperature: 0.8, // Balanced creativity
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 1000,
    }
  })

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
    const raw = result.response.text()
    console.log(`[Context Menu API] Raw response for "${sanitizedText}":`, raw)
    
    // Clean the response more thoroughly
    const cleaned = raw
      .replace(/```json\n?|\n```/g, '')
      .replace(/```\n?|\n```/g, '')
      .replace(/^[^[{]*/, '') // Remove text before JSON starts
      .replace(/[^}\]]*$/, '') // Remove text after JSON ends
      .trim()
    
    let categories
    try {
      categories = JSON.parse(cleaned)
      
      // Validate the structure
      if (!Array.isArray(categories)) {
        throw new Error('Response must be an array')
      }
      
      // Validate each category
      for (const category of categories) {
        if (!category.category || !Array.isArray(category.items)) {
          throw new Error('Each category must have "category" string and "items" array')
        }
        if (category.items.length === 0) {
          throw new Error('Each category must have at least one item')
        }
      }
      
      console.log(`[Context Menu API] Successfully parsed ${categories.length} categories for "${sanitizedText}"`)
      
    } catch (err) {
      console.error(`[Context Menu API] JSON parsing error for "${sanitizedText}":`, err, 'Raw:', raw, 'Cleaned:', cleaned)
      throw createError({ statusCode: 500, statusMessage: 'Invalid JSON response from AI' })
    }
    
    return { categories }
  } catch (error: any) {
    console.error(`[Context Menu API] Error for "${sanitizedText}":`, error)
    const message = error.response?.data?.error?.message || error.message || 'Failed to generate context menu'
    throw createError({ statusCode: 500, statusMessage: `ContextMenu Error: ${message}` })
  }
})
