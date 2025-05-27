module.exports = {
    apps : [{
      name   : "dreamseed",
      script : ".output/server/index.mjs", // Path relative to deploy directory
      cwd    : "/var/www/dreamseed", // Set current working directory
      env_file: '.env', // Load environment variables from .env file
   
            env_production: {
        NODE_ENV: "production",
        AUTH_TRUST_HOST: "true",
        env_file: '/var/www/dreamseed/.env', // Load environment variables from .env file
        // All other environment variables come from .env file via env_file
      }
    }]
  }