
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';


const MyPreset = definePreset(Aura, {
  semantic: {
      primary: {
          50: '{indigo.50}',
          100: '{indigo.100}',
          200: '{indigo.200}',
          300: '{indigo.300}',
          400: '{indigo.400}',
          500: '{indigo.500}',
          600: '{indigo.600}',
          700: '{indigo.700}',
          800: '{indigo.800}',
          900: '{indigo.900}',
          950: '{indigo.950}'
      }
  }
});


export default defineNuxtConfig({
  modules: [
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/google-fonts', // Add the google fonts module
  ],
  googleFonts: { // Add google fonts configuration
    families: {
      Roboto: true // Specify Roboto font
    }
  },
  primevue: {
    options: {
        theme: {
            options: {
                darkModeSelector: '.my-app-dark',
            },
            preset: MyPreset
        },
    }
},

  css: [
    'primeicons/primeicons.css',       // Add PrimeIcons CSS
    '~/assets/scss/main.scss',         // Your main SCSS file
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
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

})