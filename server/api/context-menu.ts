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
  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Missing node text' })
  }

  const prompt = `The user is exploring \"${text}\". Suggest 3 context menu categories with 3 actions each to further explore this concept. Return JSON like [{"category":"Category","items":["Item1","Item2"]}].`

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    })
    const raw = result.response.text()
    const cleaned = raw.replace(/```json\n?|\n```/g, '').trim()
    let categories
    try {
      categories = JSON.parse(cleaned)
    } catch (err) {
      throw createError({ statusCode: 500, statusMessage: 'Invalid JSON response from AI' })
    }
    return { categories }
  } catch (error: any) {
    const message = error.response?.data?.error?.message || error.message || 'Failed to generate context menu'
    throw createError({ statusCode: 500, statusMessage: `ContextMenu Error: ${message}` })
  }
})
