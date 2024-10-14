// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  css: ['~/assets/scss/main.scss'],
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
          additionalData: '@import "~/assets/scss/variables.scss";',
        },
      },
    },
  },

  typescript: {
    strict: true
  },

  compatibilityDate: '2024-10-07'
})


// File: store/tagStore.ts
import { defineStore } from 'pinia'

interface Tag {
  id: string
  text: string
  zone: string
  size: number
  selected: boolean
}

export const useTagStore = defineStore('tags', {
  state: () => ({
    tags: [] as Tag[],
    zones: ['Subject', 'Style', 'Mood', 'Setting', 'ColorScheme', 'Composition']
  }),
  actions: {
    addTag(tag: Tag) {
      this.tags.push(tag)
    },
    toggleTag(id: string) {
      const tag = this.tags.find(t => t.id === id)
      if (tag) tag.selected = !tag.selected
    },
    // Add more actions as needed
  },
  getters: {
    tagsByZone: (state) => {
      return (zone: string) => state.tags.filter(tag => tag.zone === zone)
    },
    selectedTags: (state) => {
      return state.tags.filter(tag => tag.selected)
    }
  }
})