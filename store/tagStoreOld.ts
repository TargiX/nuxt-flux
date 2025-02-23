// store/tagStore.ts
import { defineStore } from 'pinia'
import * as d3 from 'd3';
import { mockTags } from './mockTags';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRuntimeConfig } from '#app';

// ... (Your Tag and HybridTag interfaces) ...
interface Tag {
  id: string
  text: string
  zone: string
  size: number
  selected: boolean
  x: number //keep positions
  y: number //keep positions
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
  r?: number
}

interface HybridTag extends Tag {
  childTags: Tag[];
  isHybrid: boolean;
}

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 728;
const HYBRID_DISTANCE = 300;
const CHILD_RADIUS = 120;
const CHILD_TAG_RADIUS = 130;

const HYBRID_DIRECTIONS = [
  { angle: 0, label: 'right' },
  { angle: Math.PI / 2, label: 'bottom' },
  { angle: Math.PI, label: 'left' },
  { angle: -Math.PI / 2, label: 'top' }
];

const HYBRID_SPACING = {
  initialDistance: HYBRID_DISTANCE,
  incrementDistance: 290,
};

export const useTagStore = defineStore('tags', {
  state: () => ({
    tags: [] as Tag[],
    zones: Object.keys(mockTags),
    focusedZone: 'Subject' as string,
    hybridPositions: new Map<string, { direction: number, count: number }>(), // Track hybrid positions
     hybridCreationTimeout: null as NodeJS.Timeout | null,
  }),
  actions: {
    async fetchTags() {
        this.tags = Object.entries(mockTags).flatMap(([zone, zoneTags]) =>
          zoneTags.map((tagData, index) => ({
            id: `${zone}-${index}`,
            text: tagData.text,
            zone,
            size: 40,
            selected: false,
            x: 0, //keep positions
            y: 0, //keep positions
            fx: null,
            fy: null,
            alias: tagData.alias,
            r: 40/2,
            secondaryTags: tagData.secondaryTags.map((secondaryText, secIndex) => ({
              id: `${zone}-${index}-${secIndex}`,
              text: secondaryText,
              zone: `${zone}-secondary`,
              size: 30,
              r: 30/2,
              selected: false,
              x: 0, //keep positions
              y: 0, //keep positions
              fx: null,
              fy: null,
              alias: secondaryText.toLowerCase().replace(/\s+/g, '-'),
              isPreconfigured: true
            }))
          }))
        );
    },
    setFocusedZone(zone: string) {
      this.focusedZone = zone;
    },
    async handleNodeClick(id: string, zone: string, event: MouseEvent) {
      const tag = this.allTags.find(t => t.id === id);
      if (!tag) return;

      if (tag.isHybrid) {
        this.toggleHybridTag(tag);
      } else if (tag.zone.includes('-secondary') || tag.isHybridChild) {
          this.toggleSecondaryOrChild(tag);
      } else {
          await this.togglePrimaryTag(tag, zone); // Primary tag
      }

    },
    toggleHybridTag(tag: Tag) {
        tag.selected = !tag.selected;
        if (tag.selected) {
            // No need to add to a separate list, just rely on .selected
        } else {
           if (tag.isHybrid) {
                this.removeSelectedHybridTag(tag.id, tag.zone);
            }
        }
    },

  async toggleSecondaryOrChild(tag: Tag) {
    tag.selected = !tag.selected;
    const selectedSiblings = this.getSelectedSiblings(tag);

    if (selectedSiblings.length >= 2) {
        // Debounce hybrid creation
      if (this.hybridCreationTimeout) {
        clearTimeout(this.hybridCreationTimeout);
      }
      this.hybridCreationTimeout = setTimeout(async () => {
        const hybridTag = await this.createHybridTag(tag.zone, selectedSiblings);
          if (hybridTag && tag.isHybridChild) {
                const parentHybrid = this.getHybridTagsForZone(tag.zone)
                    .find(hybrid => hybrid.childTags?.some(child => child.id === tag.id));
                if (parentHybrid) {
                    // We don't need explicit links in the store anymore,
                    // as the relationship is managed by sourceTags and childTags
                }
          }
          selectedSiblings.forEach(t => {
            t.selected = false;
            t.isHidden = true;
          })
        }, 1000);
    }
  },

  async togglePrimaryTag(tag:Tag, zone:string) {
      const currentSelectedTag = this.tags.find(t => t.zone === zone && t.selected && t.id !== tag.id);
        if (currentSelectedTag) {
            currentSelectedTag.selected = false;
            this.hideSecondaryAndHybrid(currentSelectedTag);
        }

      tag.selected = !tag.selected;

      if (tag.selected) {
        tag.isLoading = true;
        // tag.x = DEFAULT_WIDTH / 2;  //REMOVE X,Y setting
        // tag.y = DEFAULT_HEIGHT / 2;
        // tag.fx = tag.x;  // Fix the position  //REMOVE FX,FY setting
        // tag.fy = tag.y;
        const preconfiguredTags = tag.secondaryTags || [];
        tag.secondaryTags = [];
        const newTags = await this.generateRelatedTags(tag.text);
          const allTags = [
            ...preconfiguredTags.map((t) => ({
              ...t,
              parentId: tag.id,
              isDynamic: false,
            })),
            ...newTags.map((tagText, index) => ({
              id: `${tag.id}-dynamic-${index}`,
              text: tagText,
              parentId: tag.id,
              zone: `${zone}-secondary`,
              size: tag.size * 0.8,
              r: (tag.size * 0.8)/2,
              selected: false,
              isDynamic: true,
            //   x: tag.x || 0,   //REMOVE X,Y setting
            //   y: tag.y || 0,
              fx: null,
              fy: null,
              alias: tagText.toLowerCase().replace(/\s+/g, '-'),
            })),
          ];

            tag.isLoading = false;
          allTags.forEach((newTag) => {
            this.addSecondaryTag(tag.id, newTag)
          })
        //   this.distributeChildTagsCircularly(tag); //REMOVE distributeChildTagsCircularly
      } else {
           this.hideSecondaryAndHybrid(tag)
      }
  },

    hideSecondaryAndHybrid(tag: Tag) {
        if (tag.secondaryTags) {
            tag.secondaryTags.forEach(st => {
                st.selected = false;
                st.isHidden = true;
            });
        }
        this.getHybridTagsForZone(tag.zone).forEach(hybrid => {
            if (hybrid.sourceTags?.some(source => source.id === tag.id)) {
                this.removeSelectedHybridTag(hybrid.id, tag.zone);
            }
        });
    },
    getSelectedSiblings(tag: Tag): Tag[] {
       return this.allTags.filter(sibling => {
            if (tag.isHybridChild) {
                // Find the parent hybrid and get its other selected children
                const parentHybrid = this.getHybridTagsForZone(tag.zone)
                    .find(h => h.childTags?.some(c => c.id === tag.id));
                return parentHybrid?.childTags?.filter(c => c.selected && c.id !== tag.id) || [];
            } else {
                // Get other selected secondary tags of the same parent
                const parent = this.tags.find(p => p.secondaryTags?.some(s => s.id === tag.id));
                return parent?.secondaryTags?.filter(s => s.selected && s.id !== tag.id) || [];
            }
        });
    },

    async generateRelatedTags(parentTag: string) {
      const mockTagData = Object.values(mockTags).flat().find(tag => tag.text === parentTag);
      const existingTags = mockTagData?.secondaryTags || [];

      const existingTagSet = new Set(existingTags.map(t => t.toLowerCase()))
       const config = useRuntimeConfig();
      const apiKey = config.public.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not defined');
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `You are helping users find relevant tags for their image generation. 
                When user selects "${parentTag}" as their main subject, suggest 6 additional descriptive tags.

                Requirements:
                - Each tag should be 1-2 words
                - Always start with a capital letter
                - Avoid duplicating these existing tags: ${existingTags.join(', ')}
                - Think about what users might want to achieve when they selected "${parentTag}"
                - Include both common and creative but relevant associations
                - Focus on visual and artistic aspects
                - Suggest tags that would help create interesting image variations
                - Keep tags concrete and imagery-focused

                Return only a JSON array of strings, no explanation.
                Example format: ["Mountain Peak", "Dense Forest", "Morning Mist"]`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200,
        },
      })

      const text = await response.response.text()
      try {
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
        const tags = JSON.parse(cleanedText)

        // Filter out duplicates using the Set
        const uniqueTags = tags.filter((tag: string) => !existingTagSet.has(tag.toLowerCase()))

        return Array.isArray(uniqueTags) ? uniqueTags.slice(0, 5) : []
      } catch (error) {
        console.error('Failed to parse generated tags:', error)
        console.error('Raw response:', text)
        return []
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

        // Check if this is a child hybrid (created from another hybrid's child tags)
        const parentHybrid = this.getHybridTagsForZone(zone)?.find(hybrid =>
          tags.every(tag => hybrid.childTags?.some(child => child.id === tag.id))
        );

        let hybridX, hybridY, direction;

        if (parentHybrid) {
          // This is a child hybrid - use parent's direction but increase distance
          const parentDirection = HYBRID_DIRECTIONS.find(d =>
            Math.abs(Math.atan2(parentHybrid.y - DEFAULT_HEIGHT/2, parentHybrid.x - DEFAULT_WIDTH/2) - d.angle) < 0.1
          );
          direction = parentDirection || HYBRID_DIRECTIONS[0];
          const distance = Math.sqrt(
            Math.pow(parentHybrid.x - DEFAULT_WIDTH/2, 2) +
            Math.pow(parentHybrid.y - DEFAULT_HEIGHT/2, 2)
          ) + HYBRID_SPACING.incrementDistance;

        //   hybridX = DEFAULT_WIDTH/2 + Math.cos(direction.angle) * distance; //Remove setting positions
        //   hybridY = DEFAULT_HEIGHT/2 + Math.sin(direction.angle) * distance;
        } else {
          // This is a new primary hybrid - get next available direction
          if (!this.hybridPositions.has(zone)) {
            this.hybridPositions.set(zone, { direction: 0, count: 0 });
          }
          const positionInfo = this.hybridPositions.get(zone)!;

          direction = HYBRID_DIRECTIONS[positionInfo.direction];
          const distance = HYBRID_SPACING.initialDistance +
            (HYBRID_SPACING.incrementDistance * Math.floor(positionInfo.count / HYBRID_DIRECTIONS.length));

        //   hybridX = DEFAULT_WIDTH/2 + Math.cos(direction.angle) * distance; //Remove setting positions
        //   hybridY = DEFAULT_HEIGHT/2 + Math.sin(direction.angle) * distance;

          // Update position tracking for next primary hybrid
          positionInfo.count++;
          if (positionInfo.count % HYBRID_DIRECTIONS.length === 0) {
            positionInfo.direction = 0;
          } else {
            positionInfo.direction = (positionInfo.direction + 1) % HYBRID_DIRECTIONS.length;
          }
        }

        const hybridTag: Tag = {
          id: `hybrid-${Date.now()}`,
          text: hybridText.trim(),
          zone: zone,
          size: 50,
          r: 50/2,
          selected: true,
          isHybrid: true,
          sourceTags: tags,
          childTags: [],
        //   x: hybridX,  //Remove setting positions
        //   y: hybridY,
        //   fx: hybridX,
        //   fy: hybridY,
          fx: null, //Let the force take control
          fy: null, //Let the force take control
          x: 0,
          y: 0,
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

        // When creating child tags, align them with the hybrid's direction
        const generatedTags = childTags.map((text, index) => {
        //   const childAngle = (index / childTags.length) * Math.PI * 2 + direction.angle; //Remove child positioning
        //   const childX = hybridX + Math.cos(childAngle) * CHILD_RADIUS;
        //   const childY = hybridY + Math.sin(childAngle) * CHILD_RADIUS;
          return {
            id: `${hybridTag.id}-child-${index}`,
            text,
            zone: `${zone}-secondary`,
            size: 30,
            r: 30/2,
            selected: false,
            // x: childX, // Remove setting positions
            // y: childY,
            // fx: childX,
            // fy: childY,
            fx: null, // Let force take control
            fy: null, // Let force take control
            x: 0,
            y: 0,
            alias: text.toLowerCase().replace(/\s+/g, '-'),
            isHybridChild: true
          };
        });

        hybridTag.childTags = generatedTags;

        return hybridTag;
      } catch (error) {
        console.error('Error generating hybrid tag:', error);
        const fallbackTag = {
          id: `hybrid-${Date.now()}`,
          text: tags.map(t => t.text).join(' + '),
          zone: zone,
          size: 30,
          r: 30/2,
          selected: true,
          isHybrid: true,
          childTags: tags,
          x: 0,
          y: 0,
          fx: null,
          fy: null,
          alias: `hybrid-${Date.now()}`
        };
        return fallbackTag
      }
    },

    // distributeChildTagsCircularly(parentTag: Tag) { //REMOVE distributeChildTagsCircularly
    //     const allChildTags = [
    //         ...(parentTag.secondaryTags || []),
    //     ];

    //     const angleStep = (2 * Math.PI) / allChildTags.length;
    //     const centerX = parentTag.x || DEFAULT_WIDTH / 2;
    //     const centerY = parentTag.y || DEFAULT_HEIGHT / 2;

    //     allChildTags.forEach((childTag, index) => {
    //         const angle = index * angleStep;
    //         childTag.x = centerX + Math.cos(angle) * CHILD_TAG_RADIUS;
    //         childTag.y = centerY + Math.sin(angle) * CHILD_TAG_RADIUS;
    //         childTag.fx = childTag.x;
    //         childTag.fy = childTag.y;
    //         childTag.vx = 0;
    //         childTag.vy = 0;
    //     });
    // },

    removeSelectedHybridTag(hybridTagId: string, zone: string) {
      // Find the hybrid tag object.
      const hybridTag = this.getHybridTagsForZone(zone).find(t => t.id === hybridTagId);

      if (hybridTag) {
        // Find all child hybrids
        const childHybrids = this.getHybridTagsForZone(zone).filter(otherHybrid =>
          otherHybrid.sourceTags?.some(sourceTag =>
            hybridTag.childTags?.some(childTag => childTag.id === sourceTag.id)
          )
        ) || [];

        // Recursively remove child hybrids
        childHybrids.forEach(childHybrid => {
          this.removeSelectedHybridTag(childHybrid.id, zone);
        });

        // Unselect all child tags
        hybridTag.childTags?.forEach(childTag => {
          childTag.selected = false;
          childTag.isHidden = false;
        });

        // Remove the hybrid tag from the tags array. THIS IS THE FIX.
        this.tags = this.tags.filter(tag => tag.id !== hybridTagId);


        // Unhide source tags
        hybridTag.sourceTags?.forEach(sourceTag => {
          const tag = this.allTags.find(t => t.id === sourceTag.id);
          if (tag) {
            tag.isHidden = false;
          }
        });
      }
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

        // If parent is selected, immediately distribute all child tags  //REMOVE distributeChildTagsCircularly
        // if (parent.selected) {
        //   this.distributeChildTagsCircularly(parent);
        // }
      }
    },
      updateNodePositions(updatedNodes: Tag[]) {
        // Efficiently update positions in the store, avoiding Vue reactivity issues
        updatedNodes.forEach(updatedNode => {
            const tag = this.allTags.find(t => t.id === updatedNode.id);
            if (tag) {
                // Only update position if it has changed, to minimize unnecessary reactivity updates.
                if (tag.x !== updatedNode.x || tag.y !== updatedNode.y) {
                    tag.x = updatedNode.x;
                    tag.y = updatedNode.y;
                }
                //same with fixed positions
                if (tag.fx !== updatedNode.fx || tag.fy !== updatedNode.fy) {
                    tag.fx = updatedNode.fx;
                    tag.fy = updatedNode.fy;
                }
            }
        });
      },

    resetHybridPositions(zone: string) {
      this.hybridPositions.set(zone, { direction: 0, count: 0 });
    }

  },
  getters: {
   allTags(): Tag[] {
      const allHybridTags = this.zones.flatMap(zone =>
        this.tags.filter(tag => tag.isHybrid && tag.zone === zone)
      );
      const allHybridChildTags = allHybridTags.flatMap(hybridTag => hybridTag.childTags || []);

      return [
        ...this.tags,
        ...this.tags.flatMap(tag => tag.secondaryTags || []),
        ...allHybridTags,          // Include all hybrid tags
        ...allHybridChildTags       // Include all children of hybrid tags
      ];
    },

      getNodesForZone(): (zone: string) => Tag[] {
      return (zone: string) => {
        const primaryTags = this.tags.filter(tag => tag.zone === zone && !tag.isHidden);
        const selectedPrimary = primaryTags.find(tag => tag.selected);

        if (selectedPrimary) {
          const secondaryTags = (selectedPrimary.secondaryTags || [])
            .filter(tag => !tag.isHidden);

            const hybridTags = this.getHybridTagsForZone(zone)
            .filter(tag => !tag.isHidden);

            const hybridChildTags = hybridTags.flatMap(h => h.childTags || [])
            .filter(tag => !tag.isHidden);

          return [selectedPrimary, ...secondaryTags, ...hybridTags, ...hybridChildTags];
        } else {
          // Return only non-hidden primary tags
          return primaryTags;
        }
      };
    },

    getLinksForZone(): (zone: string) => any[] {
      return (zone: string) => {
        const links: any[] = [];
        const primaryTags = this.tags.filter(tag => tag.zone === zone && !tag.isHidden);
        const selectedPrimary = primaryTags.find(tag => tag.selected);

        if (selectedPrimary) {
          // Links from primary to secondary
          (selectedPrimary.secondaryTags || [])
          .filter(tag => !tag.isHidden)
          .forEach(secondaryTag => {
            links.push({ source: selectedPrimary.id, target: secondaryTag.id, value: 1 });
          });

            const hybridTags = this.getHybridTagsForZone(zone).filter(tag => !tag.isHidden);
            //links from primary to hybrid
            hybridTags.forEach(hybridTag => {
                links.push({ source: selectedPrimary.id, target: hybridTag.id, value: 1 });
            })

          // Links from hybrid to its children
          hybridTags.forEach(hybridTag => {
            (hybridTag.childTags || [])
            .filter(tag => !tag.isHidden)
            .forEach(childTag => {
              links.push({ source: hybridTag.id, target: childTag.id, value: 1, isHybridLink: true });
            });
          });

            // Find all child hybrids that were created from this hybrid's children
            const allHybridstags = this.getHybridTagsForZone(zone)
            allHybridstags.forEach(hybridTag => {
              const childHybrids = allHybridstags.filter(otherHybrid =>
              otherHybrid.sourceTags?.every(sourceTag =>
                hybridTag.childTags?.some(childTag => childTag.id === sourceTag.id)
              )
            );
             childHybrids.forEach(childHybrid => {
              links.push({
                source: hybridTag.id,
                target: childHybrid.id,
                value: 1,
                isHybridLink: true,
                isHybridChainLink: true
              });
            });
          })
        }
        return links;
      };
    },
   getHybridTagsForZone(): (zone: string) => Tag[] {
      return (zone: string) =>
        this.tags.filter(tag => tag.isHybrid && tag.zone === zone)
    },
     allSelectedTags(): Tag[] {
      // Get visible regular tags
      const visibleTags = this.allTags.filter(tag => tag.selected && !tag.isHidden);

      // Get hybrid tags from all zones
      const allZoneHybrids = this.zones.flatMap(zone => this.getHybridTagsForZone(zone));

      const allZoneHybridChildren = allZoneHybrids.flatMap(hybrid => {
        const childTags = hybrid.childTags?.filter(child => {
          return child.selected && !child.isHidden;
        }) || [];
        return childTags;
      });

      return [...visibleTags, ...allZoneHybrids, ...allZoneHybridChildren];
    }
  }
})