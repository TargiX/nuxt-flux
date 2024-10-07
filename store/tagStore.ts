import { defineStore } from 'pinia'

interface Tag {
  id: string
  text: string
  zone: string
  size: number
  selected: boolean
  x: number
  y: number
  secondaryTags?: Tag[]
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
        Subject: [
          { text: 'Animal', secondaryTags: ['Mammal', 'Bird', 'Fish', 'Reptile', 'Insect'] },
          { text: 'Landscape', secondaryTags: ['Mountain', 'Beach', 'Forest', 'Desert', 'City'] },
          { text: 'Portrait', secondaryTags: ['Self', 'Family', 'Celebrity', 'Pet', 'Group'] },
          { text: 'Still Life', secondaryTags: ['Food', 'Flowers', 'Technology', 'Books', 'Toys'] },
          { text: 'Abstract', secondaryTags: ['Geometric', 'Fluid', 'Textural', 'Minimal', 'Chaotic'] }
        ],
        Style: [
          { text: 'Realistic', secondaryTags: ['Photorealistic', 'Hyperrealistic', 'Naturalistic', 'Veristic', 'Trompe l\'oeil'] },
          { text: 'Impressionist', secondaryTags: ['Pointillism', 'En Plein Air', 'Loose Brushwork', 'Light-focused', 'Atmospheric'] },
          { text: 'Surrealist', secondaryTags: ['Dreamlike', 'Juxtaposition', 'Symbolism', 'Biomechanical', 'Psychedelic'] },
          { text: 'Minimalist', secondaryTags: ['Geometric', 'Monochromatic', 'Negative Space', 'Simple Forms', 'Reductive'] },
          { text: 'Pop Art', secondaryTags: ['Bold Colors', 'Commercial Imagery', 'Comic Book', 'Celebrity Portraits', 'Repetition'] }
        ],
        Mood: [
          { text: 'Happy', secondaryTags: ['Joyful', 'Excited', 'Playful', 'Optimistic', 'Cheerful'] },
          { text: 'Melancholic', secondaryTags: ['Nostalgic', 'Wistful', 'Somber', 'Reflective', 'Bittersweet'] },
          { text: 'Energetic', secondaryTags: ['Dynamic', 'Vibrant', 'Lively', 'Spirited', 'Exuberant'] },
          { text: 'Calm', secondaryTags: ['Serene', 'Peaceful', 'Tranquil', 'Relaxed', 'Meditative'] },
          { text: 'Mysterious', secondaryTags: ['Enigmatic', 'Intriguing', 'Eerie', 'Cryptic', 'Obscure'] }
        ],
        Setting: [
          { text: 'Urban', secondaryTags: ['Cityscape', 'Street', 'Skyscraper', 'Subway', 'Cafe'] },
          { text: 'Nature', secondaryTags: ['Forest', 'Mountain', 'Beach', 'River', 'Field'] },
          { text: 'Indoor', secondaryTags: ['Living Room', 'Kitchen', 'Bedroom', 'Office', 'Studio'] },
          { text: 'Underwater', secondaryTags: ['Coral Reef', 'Deep Sea', 'Shipwreck', 'Kelp Forest', 'Submarine'] },
          { text: 'Space', secondaryTags: ['Planet', 'Nebula', 'Space Station', 'Asteroid Field', 'Black Hole'] }
        ],
        ColorScheme: [
          { text: 'Vibrant', secondaryTags: ['Rainbow', 'Neon', 'Saturated', 'Bold', 'Technicolor'] },
          { text: 'Monochrome', secondaryTags: ['Black and White', 'Grayscale', 'Sepia', 'Blue-toned', 'Green-toned'] },
          { text: 'Pastel', secondaryTags: ['Soft Pink', 'Light Blue', 'Mint Green', 'Lavender', 'Peach'] },
          { text: 'Dark', secondaryTags: ['Gothic', 'Muted', 'Shadowy', 'Deep Tones', 'Low Key'] },
          { text: 'Warm', secondaryTags: ['Sunset Colors', 'Earthy Tones', 'Reds and Oranges', 'Golden Hour', 'Amber'] }
        ],
        Composition: [
          { text: 'Symmetrical', secondaryTags: ['Bilateral', 'Radial', 'Reflective', 'Kaleidoscopic', 'Mandala'] },
          { text: 'Rule of Thirds', secondaryTags: ['Off-center', 'Grid', 'Balanced', 'Asymmetrical', 'Dynamic'] },
          { text: 'Leading Lines', secondaryTags: ['Perspective', 'Converging', 'Diagonal', 'S-curve', 'Zigzag'] },
          { text: 'Framing', secondaryTags: ['Natural Frame', 'Architectural', 'Foreground Elements', 'Vignette', 'Window'] },
          { text: 'Depth of Field', secondaryTags: ['Bokeh', 'Selective Focus', 'Blurred Background', 'Macro', 'Tilt-shift'] }
        ]
      };

      this.tags = Object.entries(mockTags).flatMap(([zone, zoneTags]) =>
        zoneTags.map((tagData, index) => ({
          id: `${zone}-${index}`,
          text: tagData.text,
          zone,
          size: 40, // Base size
          selected: false,
          x: 0,
          y: 0,
          secondaryTags: tagData.secondaryTags.map((secondaryText, secIndex) => ({
            id: `${zone}-${index}-${secIndex}`,
            text: secondaryText,
            zone: `${zone}-secondary`,
            size: 30, // Smaller size for secondary tags
            selected: false,
            x: 0,
            y: 0
          }))
        }))
      );
    },
    toggleTag(id: string) {
      const tag = this.tags.find(t => t.id === id)
      if (tag) {
        tag.selected = !tag.selected
        tag.size = tag.selected ? 80 : 40 // Adjust size based on selection
      }
    },
    toggleSecondaryTag(primaryId: string, secondaryId: string) {
      const primaryTag = this.tags.find(t => t.id === primaryId)
      if (primaryTag && primaryTag.secondaryTags) {
        const secondaryTag = primaryTag.secondaryTags.find(t => t.id === secondaryId)
        if (secondaryTag) {
          secondaryTag.selected = !secondaryTag.selected
          secondaryTag.size = secondaryTag.selected ? 60 : 30
        }
      }
    }
  },
  getters: {
    tagsByZone: (state) => {
      return (zone: string) => state.tags.filter(tag => tag.zone === zone)
    },
    selectedTags: (state) => {
      return state.tags.filter(tag => tag.selected)
    },
    selectedSecondaryTags: (state) => {
      return state.tags.flatMap(tag => 
        tag.secondaryTags ? tag.secondaryTags.filter(secTag => secTag.selected) : []
      )
    }
  }
})