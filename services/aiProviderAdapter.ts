import type { 
  ModelGenerationRequest, 
  ModelGenerationResponse, 
  ModelGenerationOptions,
  ProviderCredentials 
} from '~/types/models'
import { getModelConfig, getProviderConfig } from './modelConfigService'

/**
 * Base abstract class for AI Provider Adapters
 */
export abstract class AIProviderAdapter {
  abstract generateImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials
  ): Promise<ModelGenerationResponse>

  protected createErrorResponse(error: string): ModelGenerationResponse {
    return {
      success: false,
      error
    }
  }

  protected createSuccessResponse(
    imageBase64: string,
    modelUsed: string,
    generationTime: number,
    cost?: number
  ): ModelGenerationResponse {
    return {
      success: true,
      imageBase64,
      metadata: {
        modelUsed,
        generationTime,
        cost
      }
    }
  }
}

/**
 * Google AI Provider Adapter (Gemini/Imagen)
 */
export class GoogleAIAdapter extends AIProviderAdapter {
  async generateImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials
  ): Promise<ModelGenerationResponse> {
    const startTime = Date.now()
    const modelConfig = getModelConfig(request.modelId)
    
    if (!modelConfig) {
      return this.createErrorResponse(`Model ${request.modelId} not found`)
    }

    if (!credentials.apiKey) {
      return this.createErrorResponse('Google API key not provided')
    }

    // Check if this is an Imagen model (uses genai client)
    if (request.modelId.startsWith('imagen-')) {
      return this.generateImagenImage(request, credentials, modelConfig, startTime)
    }

    // Otherwise use the GenerativeAI client for Gemini models
    return this.generateGeminiImage(request, credentials, modelConfig, startTime)
  }

  private async generateImagenImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials,
    modelConfig: any,
    startTime: number
  ): Promise<ModelGenerationResponse> {
    try {
      // Use the new @google/genai package for Imagen models
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey: credentials.apiKey })

      // Map model IDs to actual Imagen model names (use exact model names)
      const imagenModelMap: Record<string, string> = {
        'imagen-4.0-generate-preview-06-06': 'imagen-4.0-generate-preview-06-06',
        'imagen-4.0-ultra-generate-preview-06-06': 'imagen-4.0-ultra-generate-preview-06-06',
        'imagen-3.0-generate-002': 'imagen-3.0-generate-002'
      }

      const actualModelName = imagenModelMap[request.modelId] || request.modelId

      console.log(`Attempting to generate image with model: ${actualModelName}`)

      try {
        // Map size to proper aspect ratio format
        const sizeToAspectRatio = (size?: string): string => {
          if (!size) return '1:1'
          
          // If already in ratio format, return as-is
          if (size.includes(':')) return size
          
          // Map pixel sizes to aspect ratios
          switch (size) {
            case '512x512':
            case '1024x1024':
              return '1:1'
            case '768x1024':
            case '768x1344':
              return '3:4'
            case '1024x768':
            case '1344x768':
              return '4:3'
            case '576x1024':
              return '9:16'
            case '1024x576':
              return '16:9'
            default:
              return '1:1'  // Default fallback
          }
        }

        const aspectRatio = sizeToAspectRatio(request.options?.size)
        console.log(`Using aspect ratio: ${aspectRatio} for size: ${request.options?.size}`)

        // Use the correct generateImages method for Imagen models
        const response = await ai.models.generateImages({
          model: actualModelName,
          prompt: request.prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: aspectRatio,
            personGeneration: 'allow_adult'  // Default to allow adult generation
          }
        })

        console.log('=== IMAGEN API RESPONSE DEBUG ===')
        console.log('Full response structure:', JSON.stringify(response, null, 2))
        console.log('Response type:', typeof response)
        console.log('Response keys:', Object.keys(response || {}))
        
        if (response.generatedImages) {
          console.log('generatedImages found, length:', response.generatedImages.length)
          console.log('generatedImages structure:', JSON.stringify(response.generatedImages, null, 2))
        } else {
          console.log('No generatedImages property found')
        }

        // Parse response according to Imagen API structure
        if (response.generatedImages && response.generatedImages.length > 0) {
          const generatedImage = response.generatedImages[0]
          console.log('First generated image structure:', JSON.stringify(generatedImage, null, 2))
          
          const imageBytes = generatedImage.image?.imageBytes
          console.log('imageBytes found:', !!imageBytes)
          console.log('imageBytes type:', typeof imageBytes)
          console.log('imageBytes length:', imageBytes?.length || 'N/A')
          
          if (!imageBytes) {
            console.log('=== TRYING ALTERNATIVE PATHS ===')
            console.log('generatedImage.imageBytes:', !!generatedImage.imageBytes)
            console.log('generatedImage.image:', !!generatedImage.image)
            console.log('generatedImage.image keys:', Object.keys(generatedImage.image || {}))
            
            return this.createErrorResponse('No image data found in Imagen response - check server logs for structure')
          }

          console.log('Successfully extracted image bytes from Imagen API')
          const mimeType = request.options?.format === 'png' ? 'image/png' : 'image/jpeg'
          const generationTime = Date.now() - startTime
          
          return this.createSuccessResponse(
            `data:${mimeType};base64,${imageBytes}`,
            request.modelId,
            generationTime,
            modelConfig.costPerImage
          )
        }

        console.log('=== NO GENERATED IMAGES FOUND ===')
        console.log('Checking for alternative response structures...')
        
        // Check for other possible response formats
        if (response.images) {
          console.log('Found response.images:', response.images)
        }
        if (response.candidates) {
          console.log('Found response.candidates:', response.candidates)
        }
        
        return this.createErrorResponse('No images generated by Imagen model - check server logs for response structure')

      } catch (apiError: any) {
        console.error('Imagen API error details:', {
          message: apiError.message,
          status: apiError.status,
          statusText: apiError.statusText,
          response: apiError.response,
          stack: apiError.stack
        })
        
        return this.createErrorResponse(
          `Imagen API error: ${apiError.message || apiError.toString()}. Model ${actualModelName} may not be available through this API.`
        )
      }
    } catch (error: any) {
      console.error('Imagen generation failed:', error)
      return this.createErrorResponse(error.message || 'Imagen generation failed')
    }
  }

  private async generateGeminiImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials,
    modelConfig: any,
    startTime: number
  ): Promise<ModelGenerationResponse> {
    try {
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey: credentials.apiKey })
      
      // Map model IDs to actual Google model names
      const googleModelMap: Record<string, string> = {
        'gemini-2.0-flash-preview-image-generation': 'gemini-2.0-flash-preview-image-generation'
      }

      const actualModelName = googleModelMap[request.modelId] || request.modelId

      console.log(`Attempting to generate image with Gemini model: ${actualModelName}`)

      const result = await ai.models.generateContent({
        model: actualModelName,
        contents: request.prompt,
        config: {
          temperature: request.options?.temperature || 0.4,
          maxOutputTokens: modelConfig.maxTokens || 2048,
          responseModalities: ['Image', 'Text']  // Must include both for Gemini image models
        }
      })

      console.log('Gemini API response received:', result)
      
      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData) {
            const generationTime = Date.now() - startTime
            return this.createSuccessResponse(
              `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
              request.modelId,
              generationTime,
              modelConfig.costPerImage
            )
          }
        }
      }

      return this.createErrorResponse('No image data found in Gemini response')
    } catch (error: any) {
      console.error('Gemini generation failed:', error)
      return this.createErrorResponse(error.message || 'Gemini generation failed')
    }
  }
}

/**
 * OpenAI Provider Adapter (DALL-E)
 */
export class OpenAIAdapter extends AIProviderAdapter {
  async generateImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials
  ): Promise<ModelGenerationResponse> {
    const startTime = Date.now()
    const modelConfig = getModelConfig(request.modelId)
    
    if (!modelConfig) {
      return this.createErrorResponse(`Model ${request.modelId} not found`)
    }

    if (!credentials.apiKey) {
      return this.createErrorResponse('OpenAI API key not provided')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.modelId,
          prompt: request.prompt,
          n: 1,
          size: request.options?.size || '1024x1024',
          quality: request.options?.quality || 'standard',
          response_format: 'b64_json'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return this.createErrorResponse(error.error?.message || 'OpenAI API error')
      }

      const data = await response.json()
      
      if (data.data?.[0]?.b64_json) {
        const generationTime = Date.now() - startTime
        return this.createSuccessResponse(
          `data:image/png;base64,${data.data[0].b64_json}`,
          request.modelId,
          generationTime,
          modelConfig.costPerImage
        )
      }

      return this.createErrorResponse('No image data found in OpenAI response')
    } catch (error: any) {
      return this.createErrorResponse(error.message || 'OpenAI generation failed')
    }
  }
}

/**
 * Flux Provider Adapter
 */
export class FluxAdapter extends AIProviderAdapter {
  async generateImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials
  ): Promise<ModelGenerationResponse> {
    const startTime = Date.now()
    const modelConfig = getModelConfig(request.modelId)
    
    if (!modelConfig) {
      return this.createErrorResponse(`Model ${request.modelId} not found`)
    }

    if (!credentials.apiKey) {
      return this.createErrorResponse('Flux API key not provided')
    }

    try {
      // Flux API implementation (placeholder - actual API may differ)
      const response = await fetch('https://api.flux.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: request.modelId,
          prompt: request.prompt,
          width: 1024,
          height: 1024,
          steps: request.options?.steps || 20,
          guidance: request.options?.guidance || 7.5,
          seed: request.options?.seed
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return this.createErrorResponse(error.message || 'Flux API error')
      }

      const data = await response.json()
      
      if (data.images?.[0]) {
        const generationTime = Date.now() - startTime
        return this.createSuccessResponse(
          data.images[0],
          request.modelId,
          generationTime,
          modelConfig.costPerImage
        )
      }

      return this.createErrorResponse('No image data found in Flux response')
    } catch (error: any) {
      return this.createErrorResponse(error.message || 'Flux generation failed')
    }
  }
}

/**
 * Stability AI Provider Adapter
 */
export class StabilityAdapter extends AIProviderAdapter {
  async generateImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials
  ): Promise<ModelGenerationResponse> {
    const startTime = Date.now()
    const modelConfig = getModelConfig(request.modelId)
    
    if (!modelConfig) {
      return this.createErrorResponse(`Model ${request.modelId} not found`)
    }

    if (!credentials.apiKey) {
      return this.createErrorResponse('Stability API key not provided')
    }

    try {
      const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text_prompts: [{ text: request.prompt }],
          cfg_scale: request.options?.guidance || 7,
          height: 1024,
          width: 1024,
          steps: request.options?.steps || 30,
          samples: 1,
          seed: request.options?.seed
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return this.createErrorResponse(error.message || 'Stability API error')
      }

      const data = await response.json()
      
      if (data.artifacts?.[0]?.base64) {
        const generationTime = Date.now() - startTime
        return this.createSuccessResponse(
          `data:image/png;base64,${data.artifacts[0].base64}`,
          request.modelId,
          generationTime,
          modelConfig.costPerImage
        )
      }

      return this.createErrorResponse('No image data found in Stability response')
    } catch (error: any) {
      return this.createErrorResponse(error.message || 'Stability generation failed')
    }
  }
}

/**
 * Midjourney Provider Adapter (via unofficial API)
 */
export class MidjourneyAdapter extends AIProviderAdapter {
  async generateImage(
    request: ModelGenerationRequest,
    credentials: ProviderCredentials
  ): Promise<ModelGenerationResponse> {
    const startTime = Date.now()
    const modelConfig = getModelConfig(request.modelId)
    
    if (!modelConfig) {
      return this.createErrorResponse(`Model ${request.modelId} not found`)
    }

    if (!credentials.apiKey) {
      return this.createErrorResponse('Midjourney API key not provided')
    }

    try {
      // Midjourney API implementation (placeholder - actual API may differ)
      const response = await fetch('https://api.midjourney.com/v1/imagine', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: request.prompt,
          version: '6',
          aspect_ratio: '1:1'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        return this.createErrorResponse(error.message || 'Midjourney API error')
      }

      const data = await response.json()
      
      if (data.image_url) {
        // Convert URL to base64 (in real implementation, you'd fetch the image)
        const generationTime = Date.now() - startTime
        return this.createSuccessResponse(
          data.image_url, // This would need to be converted to base64
          request.modelId,
          generationTime,
          modelConfig.costPerImage
        )
      }

      return this.createErrorResponse('No image data found in Midjourney response')
    } catch (error: any) {
      return this.createErrorResponse(error.message || 'Midjourney generation failed')
    }
  }
}

/**
 * Factory function to create appropriate adapter based on provider
 */
export function createProviderAdapter(providerId: string): AIProviderAdapter {
  switch (providerId) {
    case 'google':
      return new GoogleAIAdapter()
    case 'openai':
      return new OpenAIAdapter()
    case 'flux':
      return new FluxAdapter()
    case 'stability':
      return new StabilityAdapter()
    case 'midjourney':
      return new MidjourneyAdapter()
    default:
      throw new Error(`Unsupported provider: ${providerId}`)
  }
}