import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import Components from 'unplugin-vue-components/vite';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import { resolve } from 'node:path'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import commonjs from '@rollup/plugin-commonjs'

const root = dirname(fileURLToPath(import.meta.url))  

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
    '@nuxtjs/google-fonts',
    '@hebilicious/authjs-nuxt',
  ],
  
  experimental: {
    appManifest: false
  },
  


  
  nitro: {
    preset: 'node-server',
    experimental: {
      wasm: true
    },
    rollupConfig: {
      plugins: [
        commonjs({
          include: [/node_modules\/@prisma\/client/, /generated\/prisma\/client/],
          requireReturnsDefault: 'auto'
        })
      ]
    },
    alias: {
      '#auth': resolve('./node_modules/@hebilicious/authjs-nuxt/runtime')
    },
    externals: {
      inline: ['@prisma/client']
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
    'primeicons/primeicons.css',
    '~/assets/scss/main.scss',
  ],

  runtimeConfig: {
    authJs: {
      secret: process.env.NUXT_NEXTAUTH_SECRET,
      url: process.env.NUXT_NEXTAUTH_URL
    },
    authSecret: process.env.NUXT_AUTH_SECRET,
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
      authUrl: process.env.NUXT_AUTH_URL
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
    configPath: './tailwind.config.cjs',
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
}) 