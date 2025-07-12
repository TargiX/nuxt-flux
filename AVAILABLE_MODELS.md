# Available AI Models

## Google AI Models (Working)

Based on the API check, these are the **confirmed working** Google AI models:

### Gemini Models (GenerativeAI Client)
- **Gemini 2.0 Flash Image Generation** (`gemini-flash`)
  - Model ID: `models/gemini-2.0-flash-exp-image-generation`
  - Fast image generation (experimental)
  - Input: 1,048,576 tokens
  - Output: 8,192 tokens

- **Gemini 2.0 Flash Preview Image Generation** (`gemini-flash-preview`)
  - Model ID: `models/gemini-2.0-flash-preview-image-generation`
  - Preview version of Flash image generation
  - Input: 32,768 tokens
  - Output: 8,192 tokens

- **Gemini 1.5 Pro** (`gemini-pro`)
  - Model ID: `models/gemini-1.5-pro-latest`
  - High-quality multimodal model
  - Input: 2,000,000 tokens
  - Output: 8,192 tokens

### Imagen Models (genai Client)
- **Imagen 4.0 Generate** (`imagen-4-generate`)
  - Model ID: `models/imagen-4.0-generate-preview-06-06`
  - Google's latest high-quality image generation
  - Supports aspect ratios: 1:1, 16:9, 9:16, 4:3, 3:4
  - High quality, slower generation

- **Imagen 4.0 Fast** (`imagen-4-fast`)
  - Model ID: `models/imagen-4.0-fast-generate-preview-06-06`
  - Fast version of Imagen 4.0
  - Same aspect ratios as 4.0 Generate
  - Faster generation, good quality

- **Imagen 4.0 Ultra** (`imagen-4-ultra`)
  - Model ID: `models/imagen-4.0-ultra-generate-preview-06-06`
  - Ultra high-quality version
  - Premium quality, slowest generation
  - Best for final production images

- **Imagen 3.0 Generate** (`imagen-3-generate`)
  - Model ID: `models/imagen-3.0-generate-002`
  - Previous generation, stable model
  - Good quality, reliable

- **Imagen 3.0 Fast** (`imagen-3-fast`)
  - Model ID: `models/imagen-3.0-fast-generate-001`
  - Fast version of Imagen 3.0
  - Quick generation, decent quality

### Deprecated Models (Don't Use)
- ❌ `imagen-2` - Does not exist in the API
- ❌ `gemini-pro-vision` - Deprecated as of July 12, 2024

## Other Providers (To Be Tested)

### OpenAI
- **DALL-E 3** (`dall-e-3`) - Latest OpenAI image generation
- **DALL-E 2** (`dall-e-2`) - Stable OpenAI image generation

### Flux AI
- **Flux Pro** (`flux-pro`) - High-quality generation
- **Flux Dev** (`flux-dev`) - Fast development model
- **Flux Schnell** (`flux-schnell`) - Ultra-fast generation

### Stability AI
- **Stable Diffusion XL Turbo** (`sd-xl-turbo`) - Fast generation
- **Stable Diffusion XL Base** (`sd-xl-base`) - High-quality generation

### Midjourney
- **Midjourney v6** (`midjourney-v6`) - Artistic generation

## Current Status

✅ **Working**: Google AI models with valid API keys
🔄 **Needs API Keys**: OpenAI, Flux, Stability, Midjourney
🔧 **Needs Testing**: All non-Google providers

## Setup Instructions

1. **Google AI** - Already working with `GEMINI_API_KEY`
2. **OpenAI** - Add `OPENAI_API_KEY` to `.env`
3. **Flux** - Add `FLUX_API_KEY` to `.env`
4. **Stability** - Add `STABILITY_API_KEY` to `.env`
5. **Midjourney** - Add `MIDJOURNEY_API_KEY` to `.env`
6. **Replicate** - Add `REPLICATE_API_TOKEN` to `.env`