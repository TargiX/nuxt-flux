import Aura from '@primeuix/themes/aura'
import { definePreset } from '@primeuix/themes'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
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
      950: '{indigo.950}',
    },
  },
})

export default defineNuxtConfig({
  build: {
    transpile: ['import-in-the-middle', 'd3'],
  },
  modules: [
    '@primevue/nuxt-module',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@nuxtjs/google-fonts',
    '@hebilicious/authjs-nuxt',
    '@sentry/nuxt/module',
    '@nuxt/eslint',
  ],

  experimental: {
    appManifest: false,
  },

  nitro: {
    preset: 'node-server',
    alias: {
      '#auth': resolve('./node_modules/@hebilicious/authjs-nuxt/runtime'),
    },
    esbuild: {
      options: {
        banner: `import { fileURLToPath } from 'node:url';
import { dirname as _dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = _dirname(__filename);`,
      },
    },
  },

  primevue: {
    options: {
      theme: {
        options: {
          darkModeSelector: '.my-app-dark',
        },
        preset: MyPreset,
      },
    },
  },

  css: ['primeicons/primeicons.css', '~/assets/scss/main.scss'],

  runtimeConfig: {
    authJs: {
      secret: process.env.NEXTAUTH_SECRET,
    },
    authSecret: process.env.NEXTAUTH_SECRET,
    google: {
      clientId: process.env.NUXT_GOOGLE_CLIENT_ID,
      clientSecret: process.env.NUXT_GOOGLE_CLIENT_SECRET,
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
    resend: {
      apiKey: process.env.RESEND_API_KEY,
    },
    // AI Provider API Keys (server-side only)
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    FLUX_API_KEY: process.env.FLUX_API_KEY,
    STABILITY_API_KEY: process.env.STABILITY_API_KEY,
    MIDJOURNEY_API_KEY: process.env.MIDJOURNEY_API_KEY,
    REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN,
    public: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      FLUX_API_KEY: process.env.FLUX_API_KEY,
      authJs: {
        baseUrl:
          process.env.NEXTAUTH_URL ||
          (process.env.NODE_ENV === 'production'
            ? 'https://dreamseed.co'
            : 'http://localhost:3000'),
      },
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/scss/variables.scss" as v;',
        },
      },
    },
    optimizeDeps: {
      include: ['cookie-es'],
      exclude: ['cookie', '@prisma/client'],
    },
    resolve: {
      alias: { cookie: 'cookie-es' },
    },
    plugins: [
      Components({
        resolvers: [PrimeVueResolver()],
      }),
    ],
    ssr: {
      noExternal: ['@prisma/client'],
    },
    define: {
      'process.env.PRISMA_CLIENT_ENGINE_TYPE': JSON.stringify('library'),
    },
  },

  typescript: {
    strict: true,
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
