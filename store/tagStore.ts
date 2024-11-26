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
  isHybridChild?: boolean
  childTags?: Tag[]
  isHidden?: boolean
  sourceTags?: Tag[]
  parentId?: string
  vx?: number
  vy?: number
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
const CHILD_RADIUS = 120;   // Reduced from 150 (much closer to parent)
const CHILD_TAG_RADIUS = 150; // Adjust as needed for spacing

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
        if (!tag.selected) {
          const currentSelected = this.tags.find(t => t.zone === zone && t.selected && t.id !== id)
          if (currentSelected) {
            currentSelected.selected = false
            this.removeSecondaryTagsByParent(currentSelected.id)
          }
        }
        
        tag.selected = !tag.selected
        
        if (tag.selected) {
          // Center the selected tag
          tag.x = DEFAULT_WIDTH / 2;
          tag.y = DEFAULT_HEIGHT / 2;
          tag.fx = tag.x;  // Fix the position
          tag.fy = tag.y;
          
          // Distribute child tags immediately after selection
          this.distributeChildTagsCircularly(tag);
        } else {
          // Unfix the position when unselected
          tag.fx = null;
          tag.fy = null;
          
          this.removeSecondaryTagsByParent(id)
          
          const hybridsToRemove = this.zoneGraphs[zone].hybridTags || [];
          hybridsToRemove.forEach(hybridTag => {
            this.removeSelectedHybridTag(hybridTag.id, zone);
          });
        }

        // Update the graph
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

        // Create links for all nodes at once, but skip hybrid tags that were created from other hybrid's children
        links.push(...allLinkedTags
          .filter(tag => {
            if (!tag.isHybrid) return true;
            // Check if this hybrid was created from another hybrid's children
            const isChildHybrid = tag.sourceTags?.every(sourceTag => 
              this.zoneGraphs[zone].hybridTags?.some(hybrid => 
                hybrid.childTags?.some(child => child.id === sourceTag.id)
              )
            );
            return !isChildHybrid;
          })
          .map(tag => ({
            source: sourceId,
            target: tag.id,
            value: 1,
          }))
        );

        // Add links between hybrid tags and their child tags
        const hybridTags = this.zoneGraphs[zone].hybridTags || [];
        hybridTags.forEach(hybridTag => {
          if (hybridTag.childTags) {
            // Create links between hybrid tag and its child tags
            links.push(...hybridTag.childTags.map(childTag => ({
              source: hybridTag.id,
              target: childTag.id,
              value: 1,
              isHybridLink: true
            })));

            // Find any child hybrid tags that were created from this hybrid's children
            const childHybrids = hybridTags.filter(otherHybrid => 
              otherHybrid.sourceTags?.every(sourceTag => 
                hybridTag.childTags?.some(childTag => childTag.id === sourceTag.id)
              )
            );

            // Create chain links between hybrid and child hybrids
            childHybrids.forEach(childHybrid => {
              links.push({
                source: hybridTag.id,
                target: childHybrid.id,
                value: 1,
                isHybridLink: true,
                isHybridChainLink: true
              });
            });
          }
        });
      }

      return links;
    },
    setFocusedZone(zone: string) {
      this.focusedZone = zone;
    },
    async addSecondaryTag(parentId: string, tag: Tag) {
      const parent = this.tags.find(t => t.id === parentId)
      if (parent) {
        if (!parent.secondaryTags) {
          parent.secondaryTags = []
        }
        
        // Add parentId to dynamic tags
        tag.parentId = parentId;
        tag.isDynamic = true;
        tag.isPreconfigured = tag.isPreconfigured || false;
        
        parent.secondaryTags.push(tag)
        
        // If parent is selected, immediately distribute all child tags
        if (parent.selected) {
          this.distributeChildTagsCircularly(parent);
        }
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
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });

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

        // Calculate position for hybrid tag
        const angle = Math.random() * Math.PI * 2;
        const distance = HYBRID_DISTANCE;
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
          fx: hybridX,
          fy: hybridY,
          alias: hybridText.toLowerCase().replace(/\s+/g, '-')
        };

        // Generate meaningful child tags using Gemini
        const childTagsPrompt = `You are helping users find relevant tags for their image generation. 
        When user combines concepts into "${hybridText.trim()}", suggest 8 additional more specific level descriptive tags that continue story of "${hybridText.trim()}", all maintaining general ${zone} subgroup.

        Requirements:
        - Each tag should be 1-2 words
        - Always start with a capital letter
        - Think about what visual elements would extend and expand on "${hybridText.trim()}"
        - Include both common and creative but relevant associations
        - Focus on visual and artistic aspects
        - Suggest tags that would help create interesting image variations
        - Keep tags concrete and imagery-focused

        Return only a JSON array of strings, no explanation.
        Example format: ["Mountain Peak", "Dense Forest", "Morning Mist"]`;

        const childTagsResult = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: childTagsPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
          },
        });

        const childTagsText = await childTagsResult.response.text();
        let childTags: string[] = [];
        try {
          const cleanedText = childTagsText.replace(/```json\n?|\n?```/g, '').trim();
          childTags = JSON.parse(cleanedText);
        } catch (error) {
          console.error('Failed to parse generated child tags:', error);
          childTags = ['Variation 1', 'Variation 2', 'Variation 3', 'Variation 4', 'Variation 5'];
        }

        // Create child tags with fixed positions
        const generatedTags = childTags.map((text, index) => {
          const childAngle = (index / 8) * Math.PI * 2;
          const childX = hybridX + Math.cos(childAngle) * CHILD_RADIUS;
          const childY = hybridY + Math.sin(childAngle) * CHILD_RADIUS;
          return {
            id: `${hybridTag.id}-child-${index}`,
            text,
            zone: `${zone}-secondary`,
            size: 30,
            selected: false,
            x: childX,
            y: childY,
            fx: childX,
            fy: childY,
            alias: text.toLowerCase().replace(/\s+/g, '-'),
            isHybridChild: true
          };
        });

        hybridTag.childTags = generatedTags;

        // Add to zone's hybrid tags
        const zoneGraph = this.zoneGraphs[zone];
        if (zoneGraph && zoneGraph.simulation) {
          zoneGraph.hybridTags = [...(zoneGraph.hybridTags || []), hybridTag];
          
          // Just a gentle simulation restart
          zoneGraph.simulation
            ?.alpha(0.1)
            .alphaTarget(0)
            .restart();
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
    },

    distributeChildTagsCircularly(parentTag: Tag) {
      // Get all child tags (both preconfigured and dynamic)
      const allChildTags = [
        ...(parentTag.secondaryTags || []),
        ...Array.from(this.dynamicTags.get(parentTag.id) || [])
      ];
      
      const angleStep = (2 * Math.PI) / allChildTags.length;
      const centerX = parentTag.x || DEFAULT_WIDTH / 2;
      const centerY = parentTag.y || DEFAULT_HEIGHT / 2;

      allChildTags.forEach((childTag, index) => {
        const angle = index * angleStep;
        childTag.x = centerX + Math.cos(angle) * CHILD_TAG_RADIUS;
        childTag.y = centerY + Math.sin(angle) * CHILD_TAG_RADIUS;
        childTag.fx = childTag.x; // Fix position
        childTag.fy = childTag.y; // Fix position
        
        // Reset any existing velocities
        childTag.vx = 0;
        childTag.vy = 0;
      });

      // Update the zone graph if it exists
      const zoneGraph = this.zoneGraphs[parentTag.zone];
      if (zoneGraph && zoneGraph.simulation) {
        zoneGraph.simulation
          .alpha(0.1)
          .alphaDecay(0.05)
          .velocityDecay(0.6)
          .restart();
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
