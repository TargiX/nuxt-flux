import { defineStore } from 'pinia'
import * as d3 from 'd3';
import { shallowRef } from 'vue';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRuntimeConfig } from '#app';

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
  isDynamic?: boolean
  isLoading?: boolean
  isPreconfigured?: boolean
}

interface ZoneGraph {
  nodes: Tag[];
  links: any[];
  simulation: d3.Simulation<any, undefined> | null;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  lastClickedTagId: string | null;
  lastClickedNode: Tag | null;
}

// Add new interface for hybrid tags
interface HybridTag extends Tag {
  childTags: Tag[];
  isHybrid: boolean;
}

export const useTagStore = defineStore('tags', {
  state: () => ({
    tags: [] as Tag[],
    zones: ['Subject', 'Style', 'Mood', 'Setting', 'ColorScheme', 'Composition'],
    zoneGraphs: {
      Subject: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null, lastClickedTagId: null, lastClickedNode: null } as ZoneGraph,
      Style: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null, lastClickedTagId: null, lastClickedNode: null } as ZoneGraph,
      Mood: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null, lastClickedTagId: null, lastClickedNode: null } as ZoneGraph,
      Setting: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null, lastClickedTagId: null, lastClickedNode: null } as ZoneGraph,
      ColorScheme: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null, lastClickedTagId: null, lastClickedNode: null } as ZoneGraph,
      Composition: { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null, lastClickedTagId: null, lastClickedNode: null } as ZoneGraph,
    },
    focusedZone: 'Subject' as string,
    dynamicTags: new Map<string, Tag[]>() as Map<string, Tag[]>, // Store dynamic tags by parent ID
    hybridTags: new Map<string, HybridTag>(), // Store hybrid tags by combined child IDs
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
          size: 40,
          selected: false,
          x: 0,
          y: 0,
          fx: null,
          fy: null,
          alias: tagData.alias,
          secondaryTags: tagData.secondaryTags.map((secondaryText, secIndex) => ({
            id: `${zone}-${index}-${secIndex}`,
            text: secondaryText,
            zone: `${zone}-secondary`,
            size: 30,
            selected: false,
            x: 0,
            y: 0,
            fx: null,
            fy: null,
            alias: secondaryText.toLowerCase().replace(/\s+/g, '-'),
            isPreconfigured: true
          }))
        }))
      );
    },
    toggleTag(id: string, zone: string) {
      const tag = this.tags.find(t => t.id === id)
      if (tag) {
        // If we're selecting this tag, first unselect any other tag in the same zone
        if (!tag.selected) {
          const currentSelected = this.tags.find(t => t.zone === zone && t.selected && t.id !== id)
          if (currentSelected) {
            currentSelected.selected = false
            this.removeSecondaryTagsByParent(currentSelected.id)
          }
        }
        
        tag.selected = !tag.selected
        
        if (!tag.selected) {
          // When unselecting a tag, clean up its dynamic tags
          this.removeSecondaryTagsByParent(id)
        }

        // Update the graph to reflect the changes
        const zoneGraph = this.zoneGraphs[zone];
        if (zoneGraph && zoneGraph.simulation) {
          zoneGraph.simulation.alpha(0.3).restart();
        }
      }
    },
    unselectAllSecondaryTagsFromZone(zone: string, alias: string) {
      const primaryTags = this.tags.filter(tag => tag.zone === zone);
      primaryTags.forEach(primaryTag => {
        if (primaryTag.alias !== alias) {
          primaryTag.secondaryTags?.forEach(secTag => {
            secTag.selected = false;
          });
        }
      });
    },
    toggleSecondaryTag(primaryId: string, secondaryId: string) {
      const primaryTag = this.tags.find(t => t.id === primaryId)
      if (primaryTag && primaryTag.secondaryTags) {
        const secondaryTag = primaryTag.secondaryTags.find(t => t.id === secondaryId)
        if (secondaryTag) {
          secondaryTag.selected = !secondaryTag.selected;
          secondaryTag.size = 30;
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
    setLastClickedTag(zone: string, tagId: string | null, x?: number, y?: number) {
      const zoneGraph = this.zoneGraphs[zone];
      zoneGraph.lastClickedTagId = tagId;
      zoneGraph.lastClickedNode = this.tags.find(t => t.id === tagId) || null;
      if (zoneGraph.lastClickedNode && x !== undefined && y !== undefined) {
        zoneGraph.lastClickedNode.x = x;
        zoneGraph.lastClickedNode.y = y;
      }
    },

    updateZoneGraph(zone: string, nodes: Tag[], links: any[]) {
      this.zoneGraphs[zone].nodes = nodes;
      this.zoneGraphs[zone].links = links;
    },

    getSecondaryTagsForZone(zone: string): Tag[] {
      const primaryTag = this.tags.find(t => t.zone === zone && t.selected);
      return (primaryTag && !primaryTag.isLoading) ? primaryTag.secondaryTags || [] : [];
    },

    createLinksBySourceId(zone: string): any[] {
      const sourceId = this.zoneGraphs[zone].lastClickedTagId;
      if (!sourceId) return [];
      const secondaryTags = this.getSecondaryTagsForZone(zone);
      return secondaryTags.map(secTag => ({
        source: sourceId,
        target: secTag.id,
        value: 1,
      }));
    },
    setFocusedZone(zone: string) {
      this.focusedZone = zone;
    },
    addSecondaryTag(parentId: string, tag: Tag) {
      const parent = this.tags.find(t => t.id === parentId)
      if (parent) {
        if (!parent.secondaryTags) {
          parent.secondaryTags = []
        }
        tag.isDynamic = true;
        tag.isPreconfigured = tag.isPreconfigured || false;
        parent.secondaryTags.push(tag)
      }
    },

    removeSecondaryTagsByParent(parentId: string) {
      const parent = this.tags.find(t => t.id === parentId)
      if (parent && parent.secondaryTags) {
        // Keep preconfigured tags, remove only dynamic ones
        parent.secondaryTags = parent.secondaryTags.filter(tag => tag.isPreconfigured);
        // Deselect all remaining tags
        parent.secondaryTags.forEach(tag => {
          tag.selected = false;
        });
      }
    },
    setTagLoading(tagId: string, loading: boolean) {
      const tag = this.tags.find(t => t.id === tagId)
      if (tag) {
        tag.isLoading = loading
      }
    },

    async createHybridTag(zone: string, childTags: Tag[]) {
      // Sort child IDs to ensure consistent hybrid tag keys
      const childIds = childTags.map(t => t.id).sort().join('-');
      
      // Check if this hybrid already exists
      let hybridTag = this.hybridTags.get(childIds);
      if (hybridTag) return hybridTag;

      try {
        // Move useRuntimeConfig inside the action
        const config = useRuntimeConfig();
        
        // Use Gemini API like in TagCloud.vue
        const genAI = new GoogleGenerativeAI(config.public.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Create a descriptive tag name that combines these concepts: ${
          childTags.map(t => t.text).join(', ')
        }. The response should be a short phrase that captures their combination in art. Respony only with one your best suggestion, do not response with any other information.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const tag = response.text();

        // Create new hybrid tag
        hybridTag = {
          id: `hybrid-${childIds}`,
          text: tag,
          zone: `${zone}-hybrid`,
          size: 60, // Larger size for hybrid container
          selected: true,
          x: 0,
          y: 0,
          fx: null,
          fy: null,
          alias: tag.toLowerCase().replace(/\s+/g, '-'),
          isHybrid: true,
          childTags: childTags,
          isDynamic: true
        };

        this.hybridTags.set(childIds, hybridTag);
        return hybridTag;
      } catch (error) {
        console.error('Failed to create hybrid tag:', error);
        return null;
      }
    },

    removeHybridTag(hybridId: string) {
      const hybridEntries = Array.from(this.hybridTags.entries());
      const entry = hybridEntries.find(([_, tag]) => tag.id === hybridId);
      if (entry) {
        this.hybridTags.delete(entry[0]);
      }
    }
  },
  getters: {
    tagsByZone: (state) => {
      return (zone: string) => {
        const tags = state.tags.filter(tag => tag.zone === zone);
        const selectedTag = tags.find(tag => tag.selected);
        
        // If there's a selected tag, only return it; otherwise return all tags
        return selectedTag ? [selectedTag] : tags;
      }
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
    getDynamicTags: (state) => {
      return (parentId: string) => state.dynamicTags.get(parentId) || []
    },
    nonSelectedPrimaryTags: (state) => {
      return (zone: string) => state.tags.filter(tag => 
        tag.zone === zone && !tag.selected
      );
    },
    getAllSecondaryTagsForZone: (state) => {
      return (zone: string) => {
        const primaryTag = state.tags.find(t => t.zone === zone && t.selected);
        if (!primaryTag || primaryTag.isLoading) return [];
        
        // Get preconfigured secondary tags
        const preconfiguredTags = primaryTag.secondaryTags || [];
        
        // Get dynamic tags
        const dynamicTags = state.dynamicTags.get(primaryTag.id) || [];
        
        // Combine both types of tags
        return [...preconfiguredTags, ...dynamicTags];
      }
    }
  }
})
