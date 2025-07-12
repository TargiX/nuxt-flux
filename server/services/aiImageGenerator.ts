import { getModelConfig, getProviderConfig } from '~/services/modelConfigService'
import { createProviderAdapter } from '~/services/aiProviderAdapter'
import type {
  ModelGenerationRequest,
  ProviderCredentials,
  ModelGenerationResponse,
  ModelGenerationOptions,
} from '~/types/models'
import { useRuntimeConfig } from '#imports'

export async function generateImage(
  prompt: string,
  modelId: string = 'gemini-flash',
  options: ModelGenerationOptions = {}
): Promise<ModelGenerationResponse> {
  if (!prompt) {
    throw new Error('Missing prompt text')
  }

  const modelConfig = getModelConfig(modelId)
  if (!modelConfig) {
    throw new Error(`Unsupported model: ${modelId}`)
  }

  const providerConfig = getProviderConfig(modelConfig.provider.id)
  if (!providerConfig) {
    throw new Error(`Provider not found for model: ${modelId}`)
  }

  const runtimeConfig = useRuntimeConfig()

  const credentials: ProviderCredentials = {}
  for (const envVar of providerConfig.requiredEnvVars) {
    let value: string | undefined
    switch (envVar) {
      case 'GEMINI_API_KEY':
        value = runtimeConfig.GEMINI_API_KEY
        break
      case 'OPENAI_API_KEY':
        value = runtimeConfig.OPENAI_API_KEY
        break
      case 'FLUX_API_KEY':
        value = runtimeConfig.FLUX_API_KEY
        break
      case 'STABILITY_API_KEY':
        value = runtimeConfig.STABILITY_API_KEY
        break
      case 'MIDJOURNEY_API_KEY':
        value = runtimeConfig.MIDJOURNEY_API_KEY
        break
      case 'REPLICATE_API_TOKEN':
        value = runtimeConfig.REPLICATE_API_TOKEN
        break
      default:
        value = process.env[envVar]
    }

    if (!value) {
      throw new Error(
        `Missing required environment variable: ${envVar} for provider: ${providerConfig.name}`
      )
    }

    if (envVar.includes('API_KEY') || envVar.includes('TOKEN')) {
      credentials.apiKey = value
    } else if (envVar.includes('CLIENT_ID')) {
      credentials.clientId = value
    } else if (envVar.includes('CLIENT_SECRET')) {
      credentials.clientSecret = value
    }
  }

  const request: ModelGenerationRequest = {
    prompt,
    modelId,
    options: {
      size: options.size || '1024x1024',
      format: options.format || 'png',
      quality: options.quality || 'standard',
      temperature: options.temperature || 0.4,
      steps: options.steps || 20,
      guidance: options.guidance || 7.5,
      seed: options.seed,
      ...options,
    },
  }

  const adapter = createProviderAdapter(providerConfig.id)
  const result = await adapter.generateImage(request, credentials)

  if (!result.success) {
    throw new Error(`Image generation failed: ${result.error}`)
  }

  return result
}
