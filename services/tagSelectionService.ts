import type { Tag } from '~/types/tag';
import { findTagById } from './tagProcessingService';
import { generateRelatedTags } from './tagGenerationService';
import { distributeChildNodes, expandChildAwayFromParent } from './graphLayoutService';

// Helper function to get the ancestor chain of a tag
function getAncestorChain(tagId: string, allTags: Tag[]): Tag[] {
  const ancestors: Tag[] = [];
  let currentTag = findTagById(tagId, allTags);

  while (currentTag && currentTag.parentId) {
    const parent = findTagById(currentTag.parentId, allTags);
    if (parent) {
      ancestors.unshift(parent); // Add parent to the beginning of the array
      currentTag = parent;
    } else {
      break; // Parent not found, stop ascending
    }
  }
  return ancestors; // Returns ancestors from root down to immediate parent
}

export function removeDynamicChildren(tag: Tag, allTags: Tag[]): Tag[] {
  if (!tag.children) return allTags;

  // Identify dynamic children
  const dynamicIds = tag.children
    .filter(child => child.id.includes('-dyn-'))
    .map(child => child.id);

  // Remove from parent's children
  tag.children = tag.children.filter(child => !child.id.includes('-dyn-'));

  // Remove from global tags array
  return allTags.filter(t => !dynamicIds.includes(t.id));
}

export function unselectChildren(tag: Tag): void {
  if (tag.children) {
    tag.children.forEach(child => {
      child.selected = false;
      unselectChildren(child);
    });
  }
}

export function unselectTopLevelSiblings(tag: Tag, allTags: Tag[]): Tag[] {
  if (!tag.parentId) {
    let updated = allTags;
    allTags
      .filter(t => t.zone === tag.zone && !t.parentId && t.id !== tag.id)
      .forEach(t => {
        if (t.selected) {
          updated = removeDynamicChildren(t, updated);
        }
        t.selected = false;
        unselectChildren(t);
      });
    return updated;
  }
  return allTags;
}

export async function toggleTag(
  id: string,
  allTags: Tag[]
): Promise<{ updatedTags: Tag[]; selectedTag: Tag }> {
  const tag = findTagById(id, allTags);
  if (!tag) {
    throw new Error(`Tag ${id} not found`);
  }

  const wasSelected = tag.selected;
  let updatedTags = [...allTags];

  if (!wasSelected) {
    updatedTags = unselectTopLevelSiblings(tag, updatedTags);
    tag.selected = true;

    if (tag.parentId) {
      const parent = findTagById(tag.parentId, updatedTags);
      if (parent) {
        expandChildAwayFromParent(tag, parent);
      }
    }

    try {
      tag.isLoading = true;
      const ancestorChain = getAncestorChain(tag.id, updatedTags);
      const newTags = await generateRelatedTags(tag, updatedTags, ancestorChain);
      tag.children = [...(tag.children || []), ...newTags];
      updatedTags = [...updatedTags, ...newTags];
      // Distribute children in a circle after adding new ones
      distributeChildNodes(tag, 80);
    } finally {
      tag.isLoading = false;
    }
  } else {
    updatedTags = removeDynamicChildren(tag, updatedTags);
    unselectChildren(tag);
    tag.selected = false;
  }

  return { updatedTags, selectedTag: tag };
}

export async function generateConceptTags(
  id: string,
  category: string,
  action: string,
  allTags: Tag[]
): Promise<{ updatedTags: Tag[]; selectedTag: Tag }> {
  const tag = findTagById(id, allTags);
  if (!tag) {
    throw new Error(`Tag ${id} not found`);
  }

  let updatedTags = [...allTags];

  // If tag is not selected, select it first (following same logic as toggleTag)
  if (!tag.selected) {
    updatedTags = unselectTopLevelSiblings(tag, updatedTags);
    tag.selected = true;

    if (tag.parentId) {
      const parent = findTagById(tag.parentId, updatedTags);
      if (parent) {
        expandChildAwayFromParent(tag, parent);
      }
    }
  }

  try {
    tag.isLoading = true;
    const ancestorChain = getAncestorChain(tag.id, updatedTags);
    
    // Build a pseudo-parent tag with concept emphasis for generation
    const conceptTag = { ...tag, text: `${category} - ${action}` };
    const newTags = await generateRelatedTags(conceptTag, updatedTags, ancestorChain);
    
    tag.children = [...(tag.children || []), ...newTags];
    updatedTags = [...updatedTags, ...newTags];
    
    // Distribute children in a circle after adding new ones
    distributeChildNodes(tag, 80);
  } finally {
    tag.isLoading = false;
  }

  return { updatedTags, selectedTag: tag };
}

export function preselectConceptTag(
  id: string,
  category: string,
  action: string,
  allTags: Tag[]
): { updatedTags: Tag[]; selectedTag: Tag } {
  const tag = findTagById(id, allTags);
  if (!tag) {
    throw new Error(`Tag ${id} not found`);
  }

  let updatedTags = [...allTags];

  // If tag is not selected, select it first and handle sibling logic
  if (!tag.selected) {
    updatedTags = unselectTopLevelSiblings(tag, updatedTags);
    tag.selected = true;

    if (tag.parentId) {
      const parent = findTagById(tag.parentId, updatedTags);
      if (parent) {
        expandChildAwayFromParent(tag, parent);
      }
    }
  }

  return { updatedTags, selectedTag: tag };
} 