import type { Tag } from '~/types/tag'
import { mockTags } from '~/store/mockTags'

export function getAvailableZones(): string[] {
  return Object.keys(mockTags).length > 0
    ? Object.keys(mockTags)
    : ['Subject', 'Style', 'Medium', 'Mood']
}

export function processTag(
  tagData: string | Tag,
  zone: string,
  existingTags: Tag[],
  parentId?: string,
  level: number = 0
): Tag {
  const isString = typeof tagData === 'string'
  const text = isString ? tagData : tagData.text
  const id = parentId ? `${parentId}-${existingTags.length}` : `${zone}-${existingTags.length}`

  const tag: Tag = {
    id,
    text,
    size: 40,
    selected: false,
    zone,
    alias: (isString ? text.toLowerCase().replace(/\s+/g, '-') : tagData.alias) || '',
    parentId,
    x: undefined,
    y: undefined,
    isLoading: false,
    children: [],
    depth: level,
  }

  // Process children if they exist
  if (!isString && tagData.children) {
    // Process both predefined and dynamic children
    tag.children = tagData.children.map((child) => {
      const childTag = processTag(child, zone, existingTags, tag.id, level + 1)
      existingTags.push(childTag) // Add child to existingTags
      return childTag
    })
  }

  return tag
}

export function initializeTags(): Tag[] {
  const tags: Tag[] = []

  // If mockTags is empty or undefined, provide default tags
  const defaultTags: Record<string, (string | Tag)[]> = {
    Subject: ['Portrait', 'Landscape', 'Abstract'],
    Style: ['Realistic', 'Impressionist', 'Minimalist'],
    Medium: ['Digital', 'Oil Paint', 'Watercolor'],
    Mood: ['Peaceful', 'Energetic', 'Mysterious'],
  }

  const tagsToProcess = Object.keys(mockTags).length > 0 ? mockTags : defaultTags

  Object.entries(tagsToProcess).forEach(([zone, zoneTags]) => {
    zoneTags.forEach((tagData: string | Tag) => {
      const tag = processTag(tagData, zone, tags)
      if (!tag.parentId) {
        // Only push top-level tags directly
        tags.push(tag)
      }
    })
  })

  return tags
}

export function findTagById(id: string, tagList: Tag[]): Tag | undefined {
  for (const tag of tagList) {
    if (tag.id === id) return tag
    if (tag.children) {
      const found = findTagById(id, tag.children)
      if (found) return found
    }
  }
  return undefined
}
