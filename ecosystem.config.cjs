module.exports = {
    apps : [{
      name   : "dreamseed",
      script : ".output/server/index.mjs", // Path relative to deploy directory
      cwd    : "/var/www/dreamseed", // Set current working directory
      env: {
        // Default environment (often not used directly by Nuxt 3/Nitro)
        // NODE_ENV: "production", // Nitro usually sets this
      },
      env_production: {
        // Production specific variables
        NODE_ENV: "production", // Explicitly set Node environment
        // Use documented environment variable names for @hebilicious/authjs-nuxt
        NUXT_NEXTAUTH_URL: "http://5.161.248.184:3000", // Base URL of the app
        NUXT_NEXTAUTH_SECRET: process.env.NUXT_NEXTAUTH_SECRET_VALUE, // Get the actual secret from another env var
        NUXT_AUTH_SECRET: process.env.NUXT_NEXTAUTH_SECRET_VALUE, // Fallback auth secret
        NUXT_AUTH_URL: "http://5.161.248.184:3000", // Additional auth URL
        
        // CSRF bypass environment variables
        AUTH_TRUST_HOST: "true", // Trust host for CSRF bypass
        NEXTAUTH_URL: "http://5.161.248.184:3000", // Standard NextAuth URL
        NEXTAUTH_SECRET: process.env.NUXT_NEXTAUTH_SECRET_VALUE, // Standard NextAuth secret
        
        // Add other production variables here if needed
        DATABASE_URL: process.env.DATABASE_URL,
        NUXT_GOOGLE_CLIENT_ID: process.env.NUXT_GOOGLE_CLIENT_ID,
        NUXT_GOOGLE_CLIENT_SECRET: process.env.NUXT_GOOGLE_CLIENT_SECRET,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY
      }
    }]
  }