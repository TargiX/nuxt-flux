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
  isHybrid?: boolean
  childTags?: Tag[]
  isHidden?: boolean
  sourceTags?: Tag[]
}

interface ZoneGraph {
  nodes: Tag[];
  links: any[];
  simulation: d3.Simulation<any, undefined> | null;
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null;
  lastClickedTagId: string | null;
  lastClickedNode: Tag | null;
  hybridTags?: Tag[];
}

// Add new interface for hybrid tags
interface HybridTag extends Tag {
  childTags: Tag[];
  isHybrid: boolean;
}

// Add these constants at the top of the file, after imports
const DEFAULT_WIDTH = 600;  // Default width matching ForceGraph default
const DEFAULT_HEIGHT = 728; // Default height matching ForceGraph default
const HYBRID_DISTANCE = 280; // Reduced from ~400 (30% less)
const CHILD_RADIUS = 60;   // Reduced from 150 (much closer to parent)

export const useTagStore = defineStore('tags', {
  state: () => ({
    tags: [] as Tag[],
    zones: Object.keys(mockTags),
    zoneGraphs: Object.fromEntries(
      Object.keys(mockTags).map(zone => [zone, {
        nodes: shallowRef([]),
        links: shallowRef([]),
        simulation: null,
        svg: null,
        lastClickedTagId: null,
        lastClickedNode: null,
        hybridTags: []
      } as ZoneGraph])
    ),
    focusedZone: 'Subject' as string,
    dynamicTags: new Map<string, Tag[]>(), // Store dynamic tags by parent ID
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
          
          // Also clean up any hybrid tags in this zone
          const hybridsToRemove = this.zoneGraphs[zone].hybridTags || [];
          
          hybridsToRemove.forEach(hybridTag => {
            this.removeSelectedHybridTag(hybridTag.id, zone);
          });
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
      const links = [];

      if (sourceId) {
        // Get all nodes that should have links
        const allLinkedTags = [
          ...this.getSecondaryTagsForZone(zone),
          ...(this.zoneGraphs[zone].hybridTags || [])
        ];

        // Create links for all nodes at once
        links.push(...allLinkedTags.map(tag => ({
          source: sourceId,
          target: tag.id,
          value: 1,
        })));

        // Add links between hybrid tags and their child tags
        const hybridTags = this.zoneGraphs[zone].hybridTags || [];
        hybridTags.forEach(hybridTag => {
          if (hybridTag.childTags) {
            // Create links between hybrid tag and its child tags
            links.push(...hybridTag.childTags.map(childTag => ({
              source: hybridTag.id,
              target: childTag.id,
              value: 1,
              isHybridLink: true // Mark these links specially if needed
            })));
          }
        });
      }

      return links;
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

    async createHybridTag(zone: string, tags: Tag[]) {
      // Initialize Gemini
      const config = useRuntimeConfig();
      const apiKey = config.public.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Improved prompt for more specific and meaningful combinations
      const prompt = `Create a concise but descriptive tag that combines these specific concepts: ${
        tags.map(t => t.text).join(', ')
      }. 
      Requirements:
      - The result should be 2-4 words
      - Must directly reference the key elements from the input tags
      - Avoid generic or overly abstract terms
      - Focus on the unique combination of these specific elements
      - Keep it concrete and imagery-focused
      - Don't use metaphors or poetic language
      
      Return only the tag phrase, no explanation or additional text.
      
      Example inputs and good outputs:
      "Fire, Water" → "Steaming Elements"
      "Forest, Night, Magic" → "Enchanted Dark Woods"
      "Desert, Ocean" → "Coastal Sand Wilderness"`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const hybridText = await response.text();

        // Calculate a position far from center (but not too far)
        const angle = Math.random() * Math.PI * 2;
        const distance = HYBRID_DISTANCE; // Reduced distance with some randomness
        const hybridX = DEFAULT_WIDTH / 2 + Math.cos(angle) * distance;
        const hybridY = DEFAULT_HEIGHT / 2 + Math.sin(angle) * distance;

        const hybridTag: Tag = {
          id: `hybrid-${Date.now()}`,
          text: hybridText.trim(),
          zone: zone,
          size: 50,
          selected: true,
          isHybrid: true,
          sourceTags: tags,
          childTags: [],
          x: hybridX,
          y: hybridY,
          // Fix position immediately
          fx: hybridX,
          fy: hybridY,
          alias: hybridText.toLowerCase().replace(/\s+/g, '-')
        };

        // Create child tags in a tighter circle around hybrid
        const testTags = ['Test Tag 1', 'Test Tag 2', 'Test Tag 3', 'Test Tag 4', 'Test Tag 5'].map((text, index) => {
          const childAngle = (index / 5) * Math.PI * 2;
          return {
            id: `${hybridTag.id}-child-${index}`,
            text,
            zone: `${zone}-secondary`,
            size: 30, 
            selected: false,
            // Fix child positions initially
            x: hybridX + Math.cos(childAngle) * CHILD_RADIUS,
            y: hybridY + Math.sin(childAngle) * CHILD_RADIUS,
            fx: hybridX + Math.cos(childAngle) * CHILD_RADIUS,
            fy: hybridY + Math.sin(childAngle) * CHILD_RADIUS,
            alias: text.toLowerCase().replace(/\s+/g, '-'),
            isHybridChild: true
          };
        });

        hybridTag.childTags = testTags;

        // Add to zone's hybrid tags
        const zoneGraph = this.zoneGraphs[zone];
        if (zoneGraph && zoneGraph.simulation) {
          zoneGraph.hybridTags = [...(zoneGraph.hybridTags || []), hybridTag];
          
          // After a short delay, release the fixed positions
          setTimeout(() => {
            if (hybridTag) {
              hybridTag.fx = null;
              hybridTag.fy = null;
              hybridTag.childTags?.forEach(child => {
                child.fx = null;
                child.fy = null;
              });
              
              // Gently restart simulation
              zoneGraph.simulation
                ?.alpha(0.1)
                .alphaTarget(0)
                .restart();
            }
          }, 500);
        }

        // Hide source tags
        tags.forEach(sourceTag => {
          const tag = this.allTags.find(t => t.id === sourceTag.id);
          if (tag) {
            tag.isHidden = true;
            tag.selected = false;
          }
        });

        return hybridTag;
      } catch (error) {
        console.error('Error generating hybrid tag:', error);
        // Fallback to simple concatenation if LLM fails
        const fallbackTag = {
          id: `hybrid-${Date.now()}`,
          text: tags.map(t => t.text).join(' + '),
          zone: zone,
          size: 30,
          selected: true,
          isHybrid: true,
          childTags: tags,
          x: 0,
          y: 0,
          fx: null,
          fy: null,
          alias: `hybrid-${Date.now()}`
        };
        
        // Add the fallback hybrid tag directly to the zone's hybrid tags
        const zoneGraph = this.zoneGraphs[zone];
        if (zoneGraph) {
          zoneGraph.hybridTags = [...(zoneGraph.hybridTags || []), fallbackTag];
        }
        
        return fallbackTag;
      }
    },

    addSelectedHybridTag(hybridTag: Tag) {
      const zoneGraph = this.zoneGraphs[hybridTag.zone];
      if (zoneGraph) {
        // Check if this hybrid tag already exists
        const existingTag = zoneGraph.hybridTags?.find(t => 
          t.childTags?.every(child => 
            hybridTag.childTags?.some(newChild => newChild.id === child.id)
          )
        );

        if (!existingTag) {
          // Only add if it doesn't exist
          zoneGraph.hybridTags = [...(zoneGraph.hybridTags || []), hybridTag];
          
          // Hide child tags
          if (hybridTag.childTags) {
            hybridTag.childTags.forEach(childTag => {
              const tag = this.allTags.find(t => t.id === childTag.id);
              if (tag) {
                tag.isHidden = true;
                tag.selected = false;
              }
            });
          }
        }
      }
    },

    removeSelectedHybridTag(hybridTagId: string, zone: string) {
      const zoneGraph = this.zoneGraphs[zone];
      const hybridTag = zoneGraph.hybridTags?.find(t => t.id === hybridTagId);
      
      if (hybridTag) {
        zoneGraph.hybridTags = zoneGraph.hybridTags?.filter(t => t.id !== hybridTagId) || [];
        
        // Only unhide source tags, not child tags
        hybridTag.sourceTags?.forEach(sourceTag => {
          const tag = this.allTags.find(t => t.id === sourceTag.id);
          if (tag) {
            tag.isHidden = false;
          }
        });
      }
    },

    removeHybridTag(hybridId: string) {
      const hybridEntries = Array.from(this.hybridTags.entries());
      const entry = hybridEntries.find(([_, tag]) => tag.id === hybridId);
      if (entry) {
        this.hybridTags.delete(entry[0]);
      }
    },

    getHybridTagsForZone(zone: string): Tag[] {
      return this.zoneGraphs[zone].hybridTags || [];
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
        
        const secondaryTags = primaryTag.secondaryTags || [];
        const hybridTags = state.zoneGraphs[zone].hybridTags || [];
        
        return [...secondaryTags, ...hybridTags];
      }
    },
    selectedTags(): Tag[] {
      return this.allTags.filter(tag => tag.selected && !tag.isHidden);
    },
    selectedSecondaryTags(): Tag[] {
      return this.allTags.filter(tag => 
        tag.zone.includes('-secondary') && 
        tag.selected && 
        !tag.isHidden
      );
    },
    allSelectedTags(): Tag[] {
      // Get visible regular tags
      const visibleTags = this.allTags.filter(tag => tag.selected && !tag.isHidden);
      
      // Get hybrid tags from all zones
      const allZoneHybrids = Object.values(this.zoneGraphs)
        .flatMap(zoneGraph => zoneGraph.hybridTags || []);
      
      return [...visibleTags, ...allZoneHybrids];
    }
  }
})
