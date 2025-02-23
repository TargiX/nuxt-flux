// stores/tagStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useRuntimeConfig } from '#app';
import { mockTags } from './mockTags'; // your predefined tag data

export interface Tag {
  id: string;
  text: string;
  size: number;
  selected: boolean;
  zone: string;
  alias: string;
  children?: Tag[];
  parentId?: string;
  x?: number;
  y?: number;
  isLoading?: boolean;
  depth?: number;
}

export const useTagStore = defineStore('tags', () => {
  const tags = ref<Tag[]>([]);
  const zones = ref<string[]>(Object.keys(mockTags));
  const focusedZone = ref<string>('Subject');

  // Initialize preconfigured tags.
  function initializeTags() {
    tags.value = [];

    function processTag(tagData: string | Tag, zone: string, parentId?: string, level: number = 0): Tag {
      const isString = typeof tagData === 'string';
      const text = isString ? tagData : tagData.text;
      const id = parentId ? `${parentId}-${tags.value.length}` : `${zone}-${tags.value.length}`;
      const tag: Tag = {
        id,
        text,
        size: 40 - level * 10,
        selected: false,
        zone,
        alias: (isString ? text.toLowerCase().replace(/\s+/g, '-') : tagData.alias) || '',
        parentId,
        x: level === 0 ? 300 : undefined,
        y: level === 0 ? 200 : undefined,
        isLoading: false,
        children: [],
        depth: level
      };

      if (!isString && tagData.children) {
        tag.children = tagData.children.map(child => processTag(child, zone, id, level + 1));
      }

      tags.value.push(tag);
      return tag;
    }

    Object.entries(mockTags).forEach(([zone, zoneTags]) => {
      zoneTags.forEach(tagData => processTag(tagData, zone));
    });
    console.log('Initialized tags:', tags.value);
  }

  function setFocusedZone(zone: string) {
    console.log(`Setting focused zone to ${zone}`);
    focusedZone.value = zone;
  }

  function findTagById(id: string, tagList: Tag[] = tags.value): Tag | undefined {
    for (const tag of tagList) {
      if (tag.id === id) return tag;
      if (tag.children) {
        const found = findTagById(id, tag.children);
        if (found) return found;
      }
    }
    return undefined;
  }

  function unselectChildren(tag: Tag) {
    if (tag.children) {
      tag.children.forEach(child => {
        child.selected = false;
        unselectChildren(child);
      });
    }
  }

  // For top-level, only one can be selected.
  function unselectTopLevelSiblings(tag: Tag) {
    if (!tag.parentId) {
      tags.value
        .filter(t => t.zone === focusedZone.value && !t.parentId && t.id !== tag.id)
        .forEach(t => {
          t.selected = false;
          unselectChildren(t);
        });
    }
  }

  // Manually distribute children in a circle around their parent.
  function distributeChildNodes(parentTag: Tag, radius: number) {
    const children = parentTag.children || [];
    if (children.length === 0) return;
    const angleIncrement = (2 * Math.PI) / children.length;
    children.forEach((child, i) => {
      const angle = i * angleIncrement;
      const px = parentTag.x ?? 300;
      const py = parentTag.y ?? 200;
      child.x = px + radius * Math.cos(angle);
      child.y = py + radius * Math.sin(angle);
      // Pin the child by storing its coordinates.
      // (Your ForceGraph component will then render them at these positions.)
    });
  }

  // When a node is clicked to become a parent, push it farther from its own parent.
  function expandChildAwayFromParent(child: Tag) {
    if (!child.parentId) return;
    const parent = findTagById(child.parentId);
    if (!parent) return;
    const dx = (child.x ?? 0) - (parent.x ?? 0);
    const dy = (child.y ?? 0) - (parent.y ?? 0);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const newDistance = distance * 3; // Increase by factor of 2 (adjust as needed)
    const ux = dx / distance;
    const uy = dy / distance;
    child.x = (parent.x ?? 0) + newDistance * ux;
    child.y = (parent.y ?? 0) + newDistance * uy;
  }

  // Fetch dynamic tags via Gemini and merge them with existing children.
  async function generateRelatedTags(parentTag: Tag) {
    parentTag.isLoading = true;
    const existingTags = tags.value
      .filter(t => t.zone === parentTag.zone)
      .map(t => t.text.toLowerCase());
    const config = useRuntimeConfig();
    const apiKey = config.public.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
  
    const prompt = `You are helping users find relevant tags for their image generation. 
When user selects "${parentTag.text}" as their main subject, suggest 6 additional descriptive tags.

Requirements:
- Each tag should be 1-2 words
- Always start with a capital letter
- Avoid duplicating these existing tags: ${existingTags.join(', ')}
- Think about what users might want to achieve when they selected "${parentTag.text}"
- Include both common and creative but relevant associations
- Focus on visual and artistic aspects
- Suggest tags that would help create interesting image variations
- Keep tags concrete and imagery-focused

Return only a JSON array of strings, no explanation.
Example format: ["Mountain Peak", "Dense Forest", "Morning Mist"]`;
  
    try {
      const response = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 200
        }
      });
  
      const rawText = response.response.text();
      console.log('Raw Gemini response:', rawText);
      const cleanedText = rawText.replace(/```json\n|\n```/g, '').trim();
      const newTagsText = JSON.parse(cleanedText);
      const level = parentTag.size === undefined ? 0 : (40 - parentTag.size) / 10;
      const newTags = newTagsText.map((text: string, index: number) => ({
        id: `${parentTag.id}-dyn-${index}`,
        text,
        size: 40 - (level + 1) * 10,
        selected: false,
        zone: parentTag.zone,
        alias: text.toLowerCase().replace(/\s+/g, '-'),
        parentId: parentTag.id,
        x: parentTag.x,
        y: parentTag.y,
        isLoading: false,
        children: [],
        depth: (parentTag.depth ?? 0) + 1
      }));
  
      // Merge dynamic tags with any preconfigured children.
      if (parentTag.children && parentTag.children.length > 0) {
        const existingTexts = parentTag.children.map(child => child.text.toLowerCase());
        const dynamicTags = newTags.filter(tag => !existingTexts.includes(tag.text.toLowerCase()));
        parentTag.children = parentTag.children.concat(dynamicTags);
      } else {
        parentTag.children = newTags;
      }
  
      // Remove duplicates from the global store and add the new dynamic tags.
      tags.value = tags.value.filter(t => !newTags.some(nt => nt.id === t.id));
      tags.value.push(...newTags);
      console.log(`Fetched dynamic tags for ${parentTag.text}:`, newTags);
  
      // Once all dynamic tags are merged, manually distribute children.
      distributeChildNodes(parentTag, 80);
    } catch (error) {
      console.error('Error fetching dynamic tags:', error);
    } finally {
      parentTag.isLoading = false;
    }
  }
  
  // Toggle tag selection. When a tag is selected, if it’s becoming a parent,
  // push it away from its parent and fetch dynamic tags.
  function toggleTag(id: string) {
    const tag = findTagById(id);
    if (!tag) {
      console.log(`Tag ${id} not found`);
      return;
    }
  
    const wasSelected = tag.selected;
    if (!wasSelected) {
      unselectTopLevelSiblings(tag);
      tag.selected = true;
      // If this tag is a child and is becoming a parent, push it away.
      expandChildAwayFromParent(tag);
      generateRelatedTags(tag);
    } else {
      unselectChildren(tag);
      tag.selected = false;
    }
    console.log(`Toggled tag ${id} to selected: ${tag.selected}`);
  }
  
  // Compute the active branch for display.
  const activeBranch = computed(() => {
    const zoneTags = tags.value.filter(t => t.zone === focusedZone.value);
    const topLevel = zoneTags.filter(t => !t.parentId);
    if (!topLevel.some(t => t.selected)) {
      return topLevel;
    }
    let activeTop = topLevel.filter(t => t.selected);
    let visible: Tag[] = [...activeTop];
    let currentLevel = activeTop;
    while (true) {
      // Only add children if loading is finished.
      const nextLevel = currentLevel.flatMap(node => (node.children && !node.isLoading ? node.children : []));
      if (nextLevel.length === 0) break;
      visible.push(...nextLevel);
      const selectedNext = nextLevel.filter(n => n.selected);
      if (selectedNext.length === 0) break;
      currentLevel = selectedNext;
    }
    return visible;
  });
  
  const graphNodes = computed(() => activeBranch.value);
  
  // Build links: for each node, link to its children if both are visible.
  const graphLinks = computed(() => {
    const nodes = graphNodes.value;
    const links: { source: string; target: string; value: number }[] = [];
  
    nodes.forEach(node => {
      if (node.children) {
        node.children.forEach(child => {
          if (nodes.some(n => n.id === child.id)) {
            links.push({ source: node.id, target: child.id, value: 1 });
          }
        });
      }
    });
  
    return links;
  });
  
  initializeTags();
  
  return {
    tags,
    zones,
    focusedZone,
    setFocusedZone,
    toggleTag,
    graphNodes,
    graphLinks,
    findTagById
  };
});
