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
      // Use the existing GoogleGenerativeAI package - try Imagen models through generateContent
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(credentials.apiKey)

      // Map model IDs to actual Imagen model names
      const imagenModelMap: Record<string, string> = {
        'imagen-4-generate': 'imagen-4.0-generate-preview-06-06',
        'imagen-4-fast': 'imagen-4.0-fast-generate-preview-06-06',
        'imagen-4-ultra': 'imagen-4.0-ultra-generate-preview-06-06',
        'imagen-3-generate': 'imagen-3.0-generate-002',
        'imagen-3-fast': 'imagen-3.0-fast-generate-001'
      }

      const actualModelName = imagenModelMap[request.modelId] || request.modelId

      try {
        // Try using the model directly through GoogleGenerativeAI first
        const model = genAI.getGenerativeModel({ model: actualModelName })

        const generationConfig = {
          temperature: request.options?.temperature || 0.4,
          maxOutputTokens: modelConfig.maxTokens || 2048,
          responseModalities: ['Image'] as any
        }

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
          generationConfig
        })

        const response = result.response as any
        
        if (response?.candidates?.[0]?.content?.parts) {
          for (const part of response.candidates[0].content.parts) {
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

        // If no image found in standard response, fall back to direct API
        throw new Error('No image in generateContent response, trying direct API')

      } catch (generateContentError) {
        // Fallback to direct REST API for Imagen models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModelName}:generateImage?key=${credentials.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: request.prompt,
            config: {
              number_of_images: 1,
              output_mime_type: request.options?.format === 'png' ? 'image/png' : 'image/jpeg',
              person_generation: 'ALLOW_ADULT',
              aspect_ratio: request.options?.size || '1:1',
              safety_filter_level: 'BLOCK_ONLY_HIGH',
              ...(request.options?.seed && { seed: request.options.seed })
            }
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          return this.createErrorResponse(`Imagen API error: ${response.status} - ${errorText}`)
        }

        const result = await response.json()

        if (!result.generated_images || result.generated_images.length === 0) {
          return this.createErrorResponse('No images generated by Imagen model')
        }

        const generatedImage = result.generated_images[0]
        const imageData = generatedImage.image_bytes || generatedImage.image?.image_bytes
        const mimeType = request.options?.format === 'png' ? 'image/png' : 'image/jpeg'

        if (!imageData) {
          return this.createErrorResponse('No image data found in Imagen response')
        }

        const generationTime = Date.now() - startTime
        return this.createSuccessResponse(
          `data:${mimeType};base64,${imageData}`,
          request.modelId,
          generationTime,
          modelConfig.costPerImage
        )
      }
    } catch (error: any) {
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
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(credentials.apiKey)
      
      // Map model IDs to actual Google model names
      const googleModelMap: Record<string, string> = {
        'gemini-flash': 'gemini-2.0-flash-exp-image-generation',
        'gemini-flash-preview': 'gemini-2.0-flash-preview-image-generation',
        'gemini-pro': 'gemini-1.5-pro-latest'
      }

      const actualModelName = googleModelMap[request.modelId] || request.modelId
      const model = genAI.getGenerativeModel({ model: actualModelName })

      const generationConfig = {
        temperature: request.options?.temperature || 0.4,
        maxOutputTokens: modelConfig.maxTokens || 2048,
        responseModalities: ['Text', 'Image'] as any
      }

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig
      })

      const response = result.response as any
      
      if (response?.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
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

      return this.createErrorResponse('No image data found in Google AI response')
    } catch (error: any) {
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