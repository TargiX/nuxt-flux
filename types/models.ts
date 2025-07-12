export interface ModelConfig {
  id: string
  name: string
  description: string
  provider: AIProvider
  endpoint?: string
  maxTokens?: number
  supportsStylePrompts?: boolean
  costPerImage?: number
  avgGenerationTime?: number
  supportedSizes?: string[]
  supportedFormats?: string[]
}

export interface AIProvider {
  id: string
  name: string
  baseUrl?: string
  authType: 'api-key' | 'oauth' | 'basic'
  requiredEnvVars: string[]
  icon: string
  description: string
}

export interface ModelGenerationRequest {
  prompt: string
  modelId: string
  options?: ModelGenerationOptions
}

export interface ModelGenerationOptions {
  size?: string
  format?: string
  quality?: 'standard' | 'hd'
  style?: string
  temperature?: number
  steps?: number
  guidance?: number
  seed?: number
  aspect_ratio?: string
  person_generation?: 'ALLOW_ADULT' | 'BLOCK_PERSON'
  safety_filter_level?: 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_HIGH' | 'BLOCK_MOST'
  number_of_images?: number
}

export interface ModelGenerationResponse {
  success: boolean
  imageBase64?: string
  error?: string
  metadata?: {
    modelUsed: string
    generationTime: number
    cost?: number
  }
}

export interface ProviderCredentials {
  apiKey?: string
  clientId?: string
  clientSecret?: string
  accessToken?: string
}