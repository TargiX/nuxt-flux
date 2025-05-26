import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import { resolve } from 'node:path'

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
    '@hebilicious/authjs-nuxt', // Add the new auth module
  ],
  
  // Disable experimental app manifest (known to cause fetch 404 issues in some versions)
  experimental: {
    appManifest: false
  },
  googleFonts: { // Add google fonts configuration
    families: {
      Roboto: true // Specify Roboto font
    }
  },
  nitro: {
    externals: {
      // prevent bundling prisma and its runtime files
      inline: [],
      external: [
        '@prisma/client',
        '.prisma/client',
        '@prisma/engines*',            // avoid bundling the binary loader
         'generated/prisma/client/**'
      ]
    },
    esbuild: {
      options: {  
        banner: `import { fileURLToPath } from 'node:url';
import { dirname as _dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = _dirname(__filename);`
      },
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
    // Add config structure expected by @hebilicious/authjs-nuxt
    authJs: {
      secret: process.env.NUXT_NEXTAUTH_SECRET // Use the documented env var name
    },
    google: {
      clientId: process.env.NUXT_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY
    },
    public: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      FLUX_API_KEY: process.env.FLUX_API_KEY,
      authJs: {
        baseUrl: process.env.NUXT_NEXTAUTH_URL,
        verifyClientOnEveryRequest: true
      }
    }
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/variables.scss";',
          api: 'modern-compiler'
        },
      },
    },
    optimizeDeps: {
      include: ['cookie-es'],
      exclude: ['cookie']
    },
    resolve: {
      alias: { 'cookie': 'cookie-es' }
    },
    plugins: [
      Components({
        resolvers: [
          PrimeVueResolver()
        ]
      })
    ]
  },

  typescript: {
    strict: true
  },

  compatibilityDate: '2024-10-07',

  tailwindcss: {
    configPath: './tailwind.config.cjs', // Reference to the separate config file
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },

})