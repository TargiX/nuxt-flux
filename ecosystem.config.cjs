module.exports = {
    apps : [{
      name   : "dreamseed",
      script : ".output/server/index.mjs", // Path relative to deploy directory
      cwd    : "/var/www/dreamseed", // Set current working directory
      env_file: '.env', // Load environment variables from .env file
      env: {
        // Default environment (often not used directly by Nuxt 3/Nitro)
        // NODE_ENV: "production", // Nitro usually sets this
      },
            env_production: {
        NODE_ENV: "production",
        AUTH_TRUST_HOST: "true"
        // All other environment variables come from .env file via env_file
      }
    }]
  }