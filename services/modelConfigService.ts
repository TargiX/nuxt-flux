import type { ModelConfig, AIProvider } from '~/types/models'

// Define AI Providers
export const AI_PROVIDERS: Record<string, AIProvider> = {
  google: {
    id: 'google',
    name: 'Google AI',
    baseUrl: 'https://generativelanguage.googleapis.com',
    authType: 'api-key',
    requiredEnvVars: ['GEMINI_API_KEY'],
    icon: 'pi pi-google',
    description: 'Google Gemini and Imagen models'
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    authType: 'api-key',
    requiredEnvVars: ['OPENAI_API_KEY'],
    icon: 'pi pi-openai',
    description: 'DALL-E image generation models'
  },
  flux: {
    id: 'flux',
    name: 'Flux',
    baseUrl: 'https://api.flux.ai',
    authType: 'api-key',
    requiredEnvVars: ['FLUX_API_KEY'],
    icon: 'pi pi-bolt',
    description: 'Flux AI image generation models'
  },
  midjourney: {
    id: 'midjourney',
    name: 'Midjourney',
    baseUrl: 'https://api.midjourney.com',
    authType: 'api-key',
    requiredEnvVars: ['MIDJOURNEY_API_KEY'],
    icon: 'pi pi-palette',
    description: 'Midjourney artistic image generation'
  },
  stability: {
    id: 'stability',
    name: 'Stability AI',
    baseUrl: 'https://api.stability.ai',
    authType: 'api-key',
    requiredEnvVars: ['STABILITY_API_KEY'],
    icon: 'pi pi-image',
    description: 'Stable Diffusion models'
  },
  replicate: {
    id: 'replicate',
    name: 'Replicate',
    baseUrl: 'https://api.replicate.com',
    authType: 'api-key',
    requiredEnvVars: ['REPLICATE_API_TOKEN'],
    icon: 'pi pi-clone',
    description: 'Various AI models via Replicate'
  }
}

// Define Model Configurations
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // Google Gemini Models (GenerativeAI client)
  'gemini-flash': {
    id: 'gemini-flash',
    name: 'Gemini 2.0 Flash Image Generation',
    description: 'Fast Google AI image generation (experimental)',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 8192,
    supportsStylePrompts: true,
    costPerImage: 0.02,
    avgGenerationTime: 5000,
    supportedSizes: ['512x512', '1024x1024'],
    supportedFormats: ['png', 'jpeg']
  },
  'gemini-flash-preview': {
    id: 'gemini-flash-preview',
    name: 'Gemini 2.0 Flash Preview Image Generation',
    description: 'Preview version of Gemini 2.0 Flash image generation',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 8192,
    supportsStylePrompts: true,
    costPerImage: 0.02,
    avgGenerationTime: 5000,
    supportedSizes: ['512x512', '1024x1024'],
    supportedFormats: ['png', 'jpeg']
  },
  'gemini-pro': {
    id: 'gemini-pro',
    name: 'Gemini 1.5 Pro (Multi-modal)',
    description: 'High-quality Google AI model with image capabilities',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 2048000,
    supportsStylePrompts: true,
    costPerImage: 0.05,
    avgGenerationTime: 8000,
    supportedSizes: ['512x512', '1024x1024', '1536x1536'],
    supportedFormats: ['png', 'jpeg', 'webp']
  },

  // Google Imagen Models (genai client)
  'imagen-4-generate': {
    id: 'imagen-4-generate',
    name: 'Imagen 4.0 Generate',
    description: 'Google\'s latest high-quality image generation model',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 2048,
    supportsStylePrompts: true,
    costPerImage: 0.12,
    avgGenerationTime: 15000,
    supportedSizes: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedFormats: ['jpeg', 'png']
  },
  'imagen-4-fast': {
    id: 'imagen-4-fast',
    name: 'Imagen 4.0 Fast',
    description: 'Fast version of Imagen 4.0 for quick generation',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 2048,
    supportsStylePrompts: true,
    costPerImage: 0.08,
    avgGenerationTime: 8000,
    supportedSizes: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedFormats: ['jpeg', 'png']
  },
  'imagen-4-ultra': {
    id: 'imagen-4-ultra',
    name: 'Imagen 4.0 Ultra',
    description: 'Ultra high-quality version of Imagen 4.0',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 2048,
    supportsStylePrompts: true,
    costPerImage: 0.20,
    avgGenerationTime: 25000,
    supportedSizes: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedFormats: ['jpeg', 'png']
  },
  'imagen-3-generate': {
    id: 'imagen-3-generate',
    name: 'Imagen 3.0 Generate',
    description: 'Google\'s previous generation high-quality image model',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 2048,
    supportsStylePrompts: true,
    costPerImage: 0.10,
    avgGenerationTime: 12000,
    supportedSizes: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedFormats: ['jpeg', 'png']
  },
  'imagen-3-fast': {
    id: 'imagen-3-fast',
    name: 'Imagen 3.0 Fast',
    description: 'Fast version of Imagen 3.0 for quick generation',
    provider: AI_PROVIDERS.google,
    endpoint: '/v1/generateImage',
    maxTokens: 2048,
    supportsStylePrompts: true,
    costPerImage: 0.06,
    avgGenerationTime: 6000,
    supportedSizes: ['1:1', '16:9', '9:16', '4:3', '3:4'],
    supportedFormats: ['jpeg', 'png']
  },

  // OpenAI Models
  'dall-e-3': {
    id: 'dall-e-3',
    name: 'DALL-E 3',
    description: 'OpenAI\'s latest image generation with superior quality',
    provider: AI_PROVIDERS.openai,
    endpoint: '/v1/images/generations',
    maxTokens: 4000,
    supportsStylePrompts: true,
    costPerImage: 0.04,
    avgGenerationTime: 10000,
    supportedSizes: ['1024x1024', '1792x1024', '1024x1792'],
    supportedFormats: ['png']
  },
  'dall-e-2': {
    id: 'dall-e-2',
    name: 'DALL-E 2',
    description: 'OpenAI\'s stable image generation model',
    provider: AI_PROVIDERS.openai,
    endpoint: '/v1/images/generations',
    maxTokens: 1000,
    supportsStylePrompts: false,
    costPerImage: 0.02,
    avgGenerationTime: 6000,
    supportedSizes: ['256x256', '512x512', '1024x1024'],
    supportedFormats: ['png']
  },

  // Flux Models
  'flux-pro': {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'High-quality Flux generation with advanced controls',
    provider: AI_PROVIDERS.flux,
    endpoint: '/v1/generate',
    maxTokens: 2048,
    supportsStylePrompts: true,
    costPerImage: 0.03,
    avgGenerationTime: 7000,
    supportedSizes: ['512x512', '1024x1024', '1536x1536'],
    supportedFormats: ['png', 'jpeg', 'webp']
  },
  'flux-dev': {
    id: 'flux-dev',
    name: 'Flux Dev',
    description: 'Fast Flux model for development and testing',
    provider: AI_PROVIDERS.flux,
    endpoint: '/v1/generate',
    maxTokens: 1024,
    supportsStylePrompts: true,
    costPerImage: 0.015,
    avgGenerationTime: 4000,
    supportedSizes: ['512x512', '1024x1024'],
    supportedFormats: ['png', 'jpeg']
  },
  'flux-schnell': {
    id: 'flux-schnell',
    name: 'Flux Schnell',
    description: 'Ultra-fast Flux generation for quick iterations',
    provider: AI_PROVIDERS.flux,
    endpoint: '/v1/generate',
    maxTokens: 512,
    supportsStylePrompts: false,
    costPerImage: 0.01,
    avgGenerationTime: 2000,
    supportedSizes: ['512x512', '1024x1024'],
    supportedFormats: ['png']
  },

  // Midjourney Models
  'midjourney-v6': {
    id: 'midjourney-v6',
    name: 'Midjourney v6',
    description: 'Artistic AI image generation with distinctive style',
    provider: AI_PROVIDERS.midjourney,
    endpoint: '/v1/imagine',
    maxTokens: 200,
    supportsStylePrompts: true,
    costPerImage: 0.06,
    avgGenerationTime: 15000,
    supportedSizes: ['1024x1024', '1344x768', '768x1344'],
    supportedFormats: ['png', 'jpeg']
  },

  // Stability AI Models
  'sd-xl-turbo': {
    id: 'sd-xl-turbo',
    name: 'Stable Diffusion XL Turbo',
    description: 'Fast Stable Diffusion variant with good quality',
    provider: AI_PROVIDERS.stability,
    endpoint: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    maxTokens: 1024,
    supportsStylePrompts: true,
    costPerImage: 0.02,
    avgGenerationTime: 3000,
    supportedSizes: ['1024x1024'],
    supportedFormats: ['png', 'jpeg']
  },
  'sd-xl-base': {
    id: 'sd-xl-base',
    name: 'Stable Diffusion XL Base',
    description: 'High-quality Stable Diffusion with detailed results',
    provider: AI_PROVIDERS.stability,
    endpoint: '/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
    maxTokens: 2048,
    supportsStylePrompts: true,
    costPerImage: 0.035,
    avgGenerationTime: 8000,
    supportedSizes: ['1024x1024', '1536x1536'],
    supportedFormats: ['png', 'jpeg', 'webp']
  }
}

// Helper functions
export function getModelConfig(modelId: string): ModelConfig | null {
  return MODEL_CONFIGS[modelId] || null
}

export function getProviderConfig(providerId: string): AIProvider | null {
  return AI_PROVIDERS[providerId] || null
}

export function getModelsByProvider(providerId: string): ModelConfig[] {
  return Object.values(MODEL_CONFIGS).filter(model => model.provider.id === providerId)
}

export function getAllModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS)
}

export function getAllProviders(): AIProvider[] {
  return Object.values(AI_PROVIDERS)
}

export function getModelDisplayOptions() {
  return getAllModels().map(model => ({
    value: model.id,
    label: model.name,
    description: model.description,
    icon: model.provider.icon,
    provider: model.provider.name
  }))
}

export function isModelAvailable(modelId: string): boolean {
  const config = getModelConfig(modelId)
  if (!config) return false
  
  // Check if required environment variables are available
  // This would need to be checked on the server side
  return true
}

export function getDefaultModel(): string {
  // Return the current default (Gemini Flash)
  return 'gemini-flash'
}