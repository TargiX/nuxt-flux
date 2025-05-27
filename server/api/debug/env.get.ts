export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()
  
  return {
    nodeEnv: process.env.NODE_ENV,
    hasDatabase: !!process.env.DATABASE_URL,
    hasGoogleClientId: !!process.env.NUXT_GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!process.env.NUXT_GOOGLE_CLIENT_SECRET,
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    
    // Runtime config values
    runtimeConfig: {
      hasAuthSecret: !!runtimeConfig.authJs?.secret,
      hasGoogleClientId: !!runtimeConfig.google?.clientId,
      hasGoogleClientSecret: !!runtimeConfig.google?.clientSecret,
      hasGeminiKey: !!runtimeConfig.gemini?.apiKey,
      googleClientIdValue: runtimeConfig.google?.clientId || 'MISSING',
    },
    
    // Environment variables (first 10 chars only for security)
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL?.substring(0, 20) + '...' || 'MISSING',
      NUXT_GOOGLE_CLIENT_ID: process.env.NUXT_GOOGLE_CLIENT_ID?.substring(0, 10) + '...' || 'MISSING',
      NUXT_GOOGLE_CLIENT_SECRET: process.env.NUXT_GOOGLE_CLIENT_SECRET?.substring(0, 10) + '...' || 'MISSING',
    }
  }
}) 