import { createError } from 'h3'

interface GeminiRequest {
  prompt: string
  temperature?: number
  maxOutputTokens?: number
  modelName?: string
}

interface GeminiResponse {
  generatedText: string
}

export async function callGeminiAPI(payload: GeminiRequest): Promise<GeminiResponse> {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Gemini API Error Response:', errorBody)
      // Attempt to parse the error body if it's JSON
      let message = errorBody
      try {
        const parsedError = JSON.parse(errorBody)
        message = parsedError.message || parsedError.statusMessage || errorBody
      } catch (e) {
        // Ignore parsing error, use the raw text
      }
      throw new Error(`API Error (${response.status}): ${message}`)
    }

    const data = await response.json()
    return data as GeminiResponse
  } catch (error) {
    console.error('Error calling /api/gemini:', error)
    // Re-throw the error to be handled by the caller
    throw error
  }
}
