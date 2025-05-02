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
        // Add other production variables here if needed
        // DATABASE_URL: "your_production_db_string"
        
        // *** Add the crucial AUTH_ORIGIN variable ***
        AUTH_ORIGIN: "http://188.245.189.226", // Use HTTP for now

        // *** Add the public base URL including the path ***
        NUXT_PUBLIC_AUTH_BASE_URL: "http://188.245.189.226/api/auth"
      }
    }]
  }