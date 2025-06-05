import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
})

export default [
  {
    ignores: [
      '.output',
      '.data',
      '.nuxt',
      '.nitro',
      '.cache',
      'dist',
      'node_modules',
      'logs',
      '*.log',
      '.DS_Store',
      '.fleet',
      '.idea',
      'public',
      'generated',
    ],
  },
  ...compat.config({
    root: true,
    env: {
      browser: true,
      node: true,
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:vue/recommended',
      'prettier',
    ],
    plugins: ['@typescript-eslint', 'prettier'],
    parser: 'vue-eslint-parser',
    parserOptions: {
      parser: '@typescript-eslint/parser',
      sourceType: 'module',
      ecmaVersion: 2020,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  }),
]
