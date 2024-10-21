import { defineStore } from 'pinia'
import * as d3 from 'd3';

interface Tag {
  id: string
  text: string
  zone: string
  size: number
  selected: boolean
  x: number
  y: number
  fx: number | null
  fy: number | null
  alias: string
  secondaryTags?: Tag[]
}

interface ZoneGraph {
  nodes: Tag[];
  links: any[];
  simulation: d3.Simulation<any, undefined> | null;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
}

export const useTagStore = defineStore('tags', {
  state: () => ({
    tags: [] as Tag[],
    zones: ['Subject', 'Style', 'Mood', 'Setting', 'ColorScheme', 'Composition'],
    zoneGraphs: {
      Subject: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null } as ZoneGraph,
      Style: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null } as ZoneGraph,
      Mood: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null } as ZoneGraph,
      Setting: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null } as ZoneGraph,
      ColorScheme: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null } as ZoneGraph,
      Composition: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null } as ZoneGraph,
    },
    lastClickedTagId: null as string | null,
    lastClickedNode: null as Tag | null,
  }),
  actions: {
    async fetchTags() {
      // Simulating API call
      const mockTags = {
        Subject: [
          { text: 'Animal', alias: 'animal', secondaryTags: ['Mammal', 'Bird', 'Fish', 'Reptile', 'Insect'] },
          { text: 'Landscape', alias: 'landscape', secondaryTags: ['Mountain', 'Beach', 'Forest', 'Desert', 'City'] },
          { text: 'Portrait', alias: 'portrait', secondaryTags: ['Self', 'Family', 'Celebrity', 'Pet', 'Group'] },
          { text: 'Still Life', alias: 'still life', secondaryTags: ['Food', 'Flowers', 'Technology', 'Books', 'Toys'] },
          { text: 'Abstract', alias: 'abstract', secondaryTags: ['Geometric', 'Fluid', 'Textural', 'Minimal', 'Chaotic'] }
        ],
        Style: [
          { text: 'Realistic', alias: 'realistic', secondaryTags: ['Photorealistic', 'Hyperrealistic', 'Naturalistic', 'Veristic', 'Trompe l\'oeil'] },
          { text: 'Impressionist', alias: 'impressionist', secondaryTags: ['Pointillism', 'En Plein Air', 'Loose Brushwork', 'Light-focused', 'Atmospheric'] },
          { text: 'Surrealist', alias: 'surrealist', secondaryTags: ['Dreamlike', 'Juxtaposition', 'Symbolism', 'Biomechanical', 'Psychedelic'] },
          { text: 'Minimalist', alias: 'minimalist', secondaryTags: ['Geometric', 'Monochromatic', 'Negative Space', 'Simple Forms', 'Reductive'] },
          { text: 'Pop Art', alias: 'pop art', secondaryTags: ['Bold Colors', 'Commercial Imagery', 'Comic Book', 'Celebrity Portraits', 'Repetition'] }
        ],
        Mood: [
          { text: 'Happy', alias: 'happy', secondaryTags: ['Joyful', 'Excited', 'Playful', 'Optimistic', 'Cheerful'] },
          { text: 'Melancholic', alias: 'melancholic', secondaryTags: ['Nostalgic', 'Wistful', 'Somber', 'Reflective', 'Bittersweet'] },
          { text: 'Energetic', alias: 'energetic', secondaryTags: ['Dynamic', 'Vibrant', 'Lively', 'Spirited', 'Exuberant'] },
          { text: 'Calm', alias: 'calm', secondaryTags: ['Serene', 'Peaceful', 'Tranquil', 'Relaxed', 'Meditative'] },
          { text: 'Mysterious', alias: 'mysterious', secondaryTags: ['Enigmatic', 'Intriguing', 'Eerie', 'Cryptic', 'Obscure'] }
        ],
        Setting: [
          { text: 'Urban', alias: 'urban', secondaryTags: ['Cityscape', 'Street', 'Skyscraper', 'Subway', 'Cafe'] },
          { text: 'Nature', alias: 'nature', secondaryTags: ['Forest', 'Mountain', 'Beach', 'River', 'Field'] },
          { text: 'Indoor', alias: 'indoor', secondaryTags: ['Living Room', 'Kitchen', 'Bedroom', 'Office', 'Studio'] },
          { text: 'Underwater', alias: 'underwater', secondaryTags: ['Coral Reef', 'Deep Sea', 'Shipwreck', 'Kelp Forest', 'Submarine'] },
          { text: 'Space', alias: 'space', secondaryTags: ['Planet', 'Nebula', 'Space Station', 'Asteroid Field', 'Black Hole'] }
        ],
        ColorScheme: [
          { text: 'Vibrant', alias: 'vibrant', secondaryTags: ['Rainbow', 'Neon', 'Saturated', 'Bold', 'Technicolor'] },
          { text: 'Monochrome', alias: 'monochrome', secondaryTags: ['Black and White', 'Grayscale', 'Sepia', 'Blue-toned', 'Green-toned'] },
          { text: 'Pastel', alias: 'pastel', secondaryTags: ['Soft Pink', 'Light Blue', 'Mint Green', 'Lavender', 'Peach'] },
          { text: 'Dark', alias: 'dark', secondaryTags: ['Gothic', 'Muted', 'Shadowy', 'Deep Tones', 'Low Key'] },
          { text: 'Warm', alias: 'warm', secondaryTags: ['Sunset Colors', 'Earthy Tones', 'Reds and Oranges', 'Golden Hour', 'Amber'] }
        ],
        Composition: [
          { text: 'Symmetrical', alias: 'symmetrical', secondaryTags: ['Bilateral', 'Radial', 'Reflective', 'Kaleidoscopic', 'Mandala'] },
          { text: 'Rule of Thirds', alias: 'rule of thirds', secondaryTags: ['Off-center', 'Grid', 'Balanced', 'Asymmetrical', 'Dynamic'] },
          { text: 'Leading Lines', alias: 'leading lines', secondaryTags: ['Perspective', 'Converging', 'Diagonal', 'S-curve', 'Zigzag'] },
          { text: 'Framing', alias: 'framing', secondaryTags: ['Natural Frame', 'Architectural', 'Foreground Elements', 'Vignette', 'Window'] },
          { text: 'Depth of Field', alias: 'depth of field', secondaryTags: ['Bokeh', 'Selective Focus', 'Blurred Background', 'Macro', 'Tilt-shift'] }
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
          fx: null,
          fy: null,
          alias: tagData.alias, // Add the alias property
          secondaryTags: tagData.secondaryTags.map((secondaryText, secIndex) => ({
            id: `${zone}-${index}-${secIndex}`,
            text: secondaryText,
            zone: `${zone}-secondary`,
            size: 30, // Smaller size for secondary tags
            selected: false,
            x: 0,
            y: 0,
            fx: null,
            fy: null,
            alias: secondaryText.toLowerCase().replace(/\s+/g, '-'), // Generate an alias for secondary tags
          }))
        }))
      );
    },
    toggleTag(id: string, zone: string) {
      const tagToToggle = this.tags.find(t => t.id === id)
      if (tagToToggle) {
        // If the tag is being selected, unselect all other first-level tags
        if (!tagToToggle.selected) {
          this.tags.forEach(tag => {
            if (tag.id !== id && !tag.zone.includes('-secondary') && tag.zone === zone) {
              tag.selected = false
              tag.size = 40 // Reset size to base size
            }
          })
        }
        // unselect all secondary tags
        // Toggle the selected tag
        tagToToggle.selected = !tagToToggle.selected
        tagToToggle.size = tagToToggle.selected ? tagToToggle.size * 1.2 : 40 // Increase size by 20% when selected

        // Reset fixed position when toggling
        tagToToggle.fx = null
        tagToToggle.fy = null
      }
    },
    unselectAllSecondaryTagsFromZone(zone: string, alias: string) {
      // find the tags by zone with the given zone and loop thorugh each of it tags and get the secondary tags and unselect them
      // unselect only if alias is not the same as the given alias  
      
      const primaryTags = this.tags.filter(tag => tag.zone === zone);
      primaryTags.forEach(primaryTag => {
        primaryTag.secondaryTags?.forEach(secTag => {
          if (primaryTag.alias !== alias) {
            secTag.selected = false;
            secTag.size = 30; // Reset size to base size
          }
        });
      });

    },
    toggleSecondaryTag(primaryId: string, secondaryId: string) {
      const primaryTag = this.tags.find(t => t.id === primaryId)
      if (primaryTag && primaryTag.secondaryTags) {
        const secondaryTag = primaryTag.secondaryTags.find(t => t.id === secondaryId)
        if (secondaryTag) {
          secondaryTag.selected = !secondaryTag.selected
          secondaryTag.size = secondaryTag.selected ? 36 : 30 // Slightly increase size when selected
        }
      }
    },
    updateTagPosition(id: string, x: number, y: number) {
      const tag = this.tags.find(t => t.id === id) || 
                  this.tags.flatMap(t => t.secondaryTags || []).find(t => t.id === id)
      if (tag) {
        tag.x = x
        tag.y = y
      }
    },
    fixTagPosition(id: string, x: number, y: number) {
      const tag = this.tags.find(t => t.id === id) || 
                  this.tags.flatMap(t => t.secondaryTags || []).find(t => t.id === id)
      if (tag) {
        tag.fx = x
        tag.fy = y
      }
    },
    unfixTagPosition(id: string) {
      const tag = this.tags.find(t => t.id === id) || 
                  this.tags.flatMap(t => t.secondaryTags || []).find(t => t.id === id)
      if (tag) {
        tag.fx = null
        tag.fy = null
      }
    },
    getSecondaryTagsByZoneAndAlias(zone: string, alias: string) {
      const primaryTag = this.tags.find(t => t.zone === zone && t.alias === alias);
      return primaryTag ? primaryTag.secondaryTags || [] : [];
    },
    setLastClickedTag(tagId: string | null, x?: number, y?: number) {
      this.lastClickedTagId = tagId;
      this.lastClickedNode = this.tags.find(t => t.id === tagId) || null;
      if (this.lastClickedNode && x !== undefined && y !== undefined) {
        this.lastClickedNode.x = x;
        this.lastClickedNode.y = y;
      }
    },

    updateZoneGraph(zone: string, nodes: Tag[], links: any[]) {
      this.zoneGraphs[zone].nodes = nodes;
      this.zoneGraphs[zone].links = links;
    },

    getSecondaryTagsForZone(zone: string): Tag[] {
      const primaryTag = this.tags.find(t => t.zone === zone && t.selected);
      return primaryTag ? primaryTag.secondaryTags || [] : [];
    },

    createLinksBySourceId(zone: string, sourceId: string | null): any[] {
      if (!sourceId) return [];
      const secondaryTags = this.getSecondaryTagsForZone(zone);
      return secondaryTags.map(secTag => ({
        source: sourceId,
        target: secTag.id,
        value: 1,
      }));
    },
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
    },
    allTags: (state) => {
      return [
        ...state.tags,
        ...state.tags.flatMap(tag => tag.secondaryTags || [])
      ]
    },
    getZoneGraph: (state) => {
      return (zone: string) => state.zoneGraphs[zone];
    },
  }
})
