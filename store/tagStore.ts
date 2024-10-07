import { defineStore } from 'pinia'

interface Tag {
  id: string
  text: string
  zone: string
  size: number
  selected: boolean
  x: number
  y: number
}

export const useTagStore = defineStore('tags', {
  state: () => ({
    tags: [] as Tag[],
    zones: ['Subject', 'Style', 'Mood', 'Setting', 'ColorScheme', 'Composition']
  }),
  actions: {
    async fetchTags() {
      // Simulating API call
      const mockTags = {
        Subject: ['Portrait', 'Landscape', 'Still Life', 'Abstract', 'Animal'],
        Style: ['Realistic', 'Impressionist', 'Surrealist', 'Minimalist', 'Pop Art'],
        Mood: ['Happy', 'Melancholic', 'Energetic', 'Calm', 'Mysterious'],
        Setting: ['Urban', 'Nature', 'Indoor', 'Underwater', 'Space'],
        ColorScheme: ['Vibrant', 'Monochrome', 'Pastel', 'Dark', 'Warm'],
        Composition: ['Symmetrical', 'Rule of Thirds', 'Leading Lines', 'Framing', 'Diagonal']
      };

      this.tags = Object.entries(mockTags).flatMap(([zone, tagTexts]) =>
        tagTexts.map((text, index) => ({
          id: `${zone}-${index}`,
          text,
          zone,
          size: 20, // Fixed size for simplicity
          selected: false,
          x: 0,
          y: 0
        }))
      );
    },
    toggleTag(id: string) {
      const tag = this.tags.find(t => t.id === id)
      if (tag) {
        tag.selected = !tag.selected
      }
    }
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