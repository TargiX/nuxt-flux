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
        NUXT_NEXTAUTH_URL: "http://188.245.189.226", // Base URL of the app
        NUXT_NEXTAUTH_SECRET: process.env.NUXT_NEXTAUTH_SECRET_VALUE // Get the actual secret from another env var
        
        // Add other production variables here if needed
        // DATABASE_URL: "your_production_db_string"
      }
    }]
  }