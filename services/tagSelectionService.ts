import type { Tag } from '~/types/tag'
import { findTagById } from './tagProcessingService'
import { generateRelatedTags } from './tagGenerationService'
import { distributeChildNodes, expandChildAwayFromParent } from './graphLayoutService'

// Helper function to get the ancestor chain of a tag
function getAncestorChain(tagId: string, allTags: Tag[]): Tag[] {
  const ancestors: Tag[] = []
  let currentTag = findTagById(tagId, allTags)

  while (currentTag && currentTag.parentId) {
    const parent = findTagById(currentTag.parentId, allTags)
    if (parent) {
      ancestors.unshift(parent) // Add parent to the beginning of the array
      currentTag = parent
    } else {
      break // Parent not found, stop ascending
    }
  }
  return ancestors // Returns ancestors from root down to immediate parent
}

export function removeDynamicChildren(tag: Tag, allTags: Tag[]): Tag[] {
  if (!tag.children) return allTags

  // Identify dynamic children
  const dynamicIds = tag.children
    .filter((child) => child.id.includes('-dyn-'))
    .map((child) => child.id)

  // Remove from parent's children
  tag.children = tag.children.filter((child) => !child.id.includes('-dyn-'))

  // Remove from global tags array
  return allTags.filter((t) => !dynamicIds.includes(t.id))
}

export function unselectChildren(tag: Tag): void {
  if (tag.children) {
    tag.children.forEach((child) => {
      child.selected = false
      unselectChildren(child)
    })
  }
}

export function unselectTopLevelSiblings(tag: Tag, allTags: Tag[]): Tag[] {
  if (!tag.parentId) {
    let updated = allTags
    allTags
      .filter((t) => t.zone === tag.zone && !t.parentId && t.id !== tag.id)
      .forEach((t) => {
        if (t.selected) {
          updated = removeDynamicChildren(t, updated)
        }
        t.selected = false
        unselectChildren(t)
      })
    return updated
  }
  return allTags
}

export async function toggleTag(
  id: string,
  allTags: Tag[]
): Promise<{ updatedTags: Tag[]; selectedTag: Tag }> {
  const tag = findTagById(id, allTags)
  if (!tag) {
    throw new Error(`Tag ${id} not found`)
  }

  const wasSelected = tag.selected
  let updatedTags = [...allTags]

  if (!wasSelected) {
    updatedTags = unselectTopLevelSiblings(tag, updatedTags)
    tag.selected = true

    if (tag.parentId) {
      const parent = findTagById(tag.parentId, updatedTags)
      if (parent) {
        expandChildAwayFromParent(tag, parent)
      }
    }

    // Skip predefined child generation for transformed nodes
    if (!tag.isTransformed) {
      try {
        tag.isLoading = true
        const ancestorChain = getAncestorChain(tag.id, updatedTags)
        const newTags = await generateRelatedTags(tag, updatedTags, ancestorChain)
        tag.children = [...(tag.children || []), ...newTags]
        updatedTags = [...updatedTags, ...newTags]
        // Distribute children in a circle after adding new ones
        distributeChildNodes(tag, 80)
      } finally {
        tag.isLoading = false
      }
    } else {
      console.log(
        `[TagSelection] Skipping predefined child generation for transformed node: ${tag.text}`
      )
    }
  } else {
    updatedTags = removeDynamicChildren(tag, updatedTags)
    unselectChildren(tag)
    tag.selected = false

    // Clear transformation state when deselecting
    if (tag.isTransformed) {
      console.log(`[TagSelection] Clearing transformation state for deselected node: ${tag.text}`)
      tag.isTransformed = false
      // Optionally restore original text
      if (tag.originalText) {
        tag.text = tag.originalText
        tag.originalText = undefined
      }
    }
  }

  return { updatedTags, selectedTag: tag }
}

export async function generateConceptTags(
  id: string,
  category: string,
  action: string,
  allTags: Tag[]
): Promise<{ updatedTags: Tag[]; selectedTag: Tag }> {
  const tag = findTagById(id, allTags)
  if (!tag) {
    throw new Error(`Tag ${id} not found`)
  }

  let updatedTags = [...allTags]

  // If tag is not selected, select it first (following same logic as toggleTag)
  if (!tag.selected) {
    updatedTags = unselectTopLevelSiblings(tag, updatedTags)
    tag.selected = true

    if (tag.parentId) {
      const parent = findTagById(tag.parentId, updatedTags)
      if (parent) {
        expandChildAwayFromParent(tag, parent)
      }
    }
  }

  try {
    tag.isLoading = true
    const ancestorChain = getAncestorChain(tag.id, updatedTags)

    // Build a pseudo-parent tag with concept emphasis for generation
    const conceptTag = { ...tag, text: `${category} - ${action}` }
    const newTags = await generateRelatedTags(conceptTag, updatedTags, ancestorChain)

    tag.children = [...(tag.children || []), ...newTags]
    updatedTags = [...updatedTags, ...newTags]

    // Distribute children in a circle after adding new ones
    distributeChildNodes(tag, 80)
  } finally {
    tag.isLoading = false
  }

  return { updatedTags, selectedTag: tag }
}

export function preselectConceptTag(
  id: string,
  category: string,
  action: string,
  allTags: Tag[]
): { updatedTags: Tag[]; selectedTag: Tag } {
  const tag = findTagById(id, allTags)
  if (!tag) {
    throw new Error(`Tag ${id} not found`)
  }

  let updatedTags = [...allTags]

  // If tag is not selected, select it first and handle sibling logic
  if (!tag.selected) {
    updatedTags = unselectTopLevelSiblings(tag, updatedTags)
    tag.selected = true

    if (tag.parentId) {
      const parent = findTagById(tag.parentId, updatedTags)
      if (parent) {
        expandChildAwayFromParent(tag, parent)
      }
    }
  }

  return { updatedTags, selectedTag: tag }
}

export function transformNodeConcept(
  id: string,
  category: string,
  action: string,
  allTags: Tag[]
): { updatedTags: Tag[]; transformedTag: Tag } {
  const tag = findTagById(id, allTags)
  if (!tag) {
    throw new Error(`Tag ${id} not found`)
  }

  let updatedTags = [...allTags]

  // Remove any existing children of this tag from the global tags array
  if (tag.children && tag.children.length > 0) {
    const childIds = new Set<string>()

    // Recursively collect all descendant IDs
    function collectDescendants(children: Tag[]) {
      children.forEach((child) => {
        childIds.add(child.id)
        if (child.children) {
          collectDescendants(child.children)
        }
      })
    }
    collectDescendants(tag.children)

    // Remove descendants from global tags array
    updatedTags = updatedTags.filter((t) => !childIds.has(t.id))
  }

  // Store original text before transformation
  const originalText = tag.text

  console.log(`[TRANSFORM] Starting transformation of tag ${id}:`)
  console.log(`[TRANSFORM] - Original text: "${originalText}"`)
  console.log(`[TRANSFORM] - New text: "${action}"`)

  // Transform the tag
  tag.text = action // Transform to the selected concept (e.g., "giant red tree")
  tag.children = [] // Clear children
  tag.isTransformed = true // Mark as transformed to prevent predefined loading
  tag.originalText = originalText !== action ? originalText : undefined // Store original if different

  console.log(`[TRANSFORM] After transformation:`)
  console.log(`[TRANSFORM] - tag.text: "${tag.text}"`)
  console.log(`[TRANSFORM] - tag.isTransformed: ${tag.isTransformed}`)
  console.log(`[TRANSFORM] - tag.originalText: "${tag.originalText}"`)
  console.log(`[TRANSFORM] - tag.id: "${tag.id}"`)
  console.log(`[TRANSFORM] - Full tag:`, JSON.stringify(tag, null, 2))

  // Handle selection and sibling logic
  if (!tag.selected) {
    updatedTags = unselectTopLevelSiblings(tag, updatedTags)
    tag.selected = true

    if (tag.parentId) {
      const parent = findTagById(tag.parentId, updatedTags)
      if (parent) {
        expandChildAwayFromParent(tag, parent)
      }
    }
  }

  return { updatedTags, transformedTag: tag }
}

export async function generateConceptTagsForTransformed(
  transformedTag: Tag,
  allTags: Tag[]
): Promise<{ updatedTags: Tag[]; selectedTag: Tag }> {
  let updatedTags = [...allTags]

  try {
    transformedTag.isLoading = true
    const ancestorChain = getAncestorChain(transformedTag.id, updatedTags)

    // Generate tags based on the transformed concept
    const newTags = await generateRelatedTags(transformedTag, updatedTags, ancestorChain)

    transformedTag.children = [...newTags]
    updatedTags = [...updatedTags, ...newTags]

    // Distribute children in a circle after adding new ones
    distributeChildNodes(transformedTag, 80)
  } finally {
    transformedTag.isLoading = false
  }

  return { updatedTags, selectedTag: transformedTag }
}
