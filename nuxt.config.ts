
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    // 'flowbite/plugin' // Already removed in Step 1
  ],

  css: [
    '~/assets/scss/main.scss',         // Your main SCSS file
    'flowbite/dist/flowbite.css'       // Flowbite's CSS
  ],

  runtimeConfig: {
    public: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      FLUX_API_KEY: process.env.FLUX_API_KEY
    }
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/variables.scss";',
          // Remove 'api: modern-compiler' as it's invalid
        },
      },
    },
  },

  typescript: {
    strict: true
  },

  compatibilityDate: '2024-10-07',

  tailwindcss: {
    configPath: './tailwind.config.js', // Reference to the separate config file
    // quiet: false, // Optionally set to true to suppress warnings
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

})