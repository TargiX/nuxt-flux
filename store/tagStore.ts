import { defineStore } from 'pinia'
import * as d3 from 'd3';
import { shallowRef } from 'vue';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRuntimeConfig } from '#app';


import { mockTags } from './mockTags';

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
    zones: Object.keys(mockTags),
    zoneGraphs: Object.fromEntries(
      Object.keys(mockTags).map(zone => [zone, { nodes: shallowRef([]), links: shallowRef([]), simulation: null, svg: null, lastClickedTagId: null, lastClickedNode: null } as ZoneGraph])
    ),
    focusedZone: 'Subject' as string,
    dynamicTags: new Map<string, Tag[]>() as Map<string, Tag[]>, // Store dynamic tags by parent ID
    hybridTags: new Map<string, HybridTag>(), // Store hybrid tags by combined child IDs
  }),
  actions: {
    async fetchTags() {
      // Simulating API call
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

        const prompt = `Combine the following concepts into a single, intuitive, and descriptive tag name suitable for creative art or design: ${
          childTags.map(t => t.text).join(', ')
        }. The tag phrase should be simple, clear, and directly reflective of the given ideas, avoiding overly complex or abstract phrasing. Respond with only your single best suggestion phrase 2-3 words.`;
        

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
