import { describe, it, expect } from 'vitest'
import { removeDynamicChildren } from '../../services/tagSelectionService'
import type { Tag } from '../../types/tag'

describe('tagSelectionService', () => {
  it('removes dynamic children from tag and list', () => {
    const parent: Tag = {
      id: '1',
      text: 'Parent',
      selected: false,
      zone: 'Test',
      size: 40,
      children: [],
      depth: 0,
    }
    const childStatic: Tag = {
      id: '2',
      text: 'Child',
      selected: false,
      zone: 'Test',
      size: 40,
      parentId: '1',
      children: [],
      depth: 1,
    }
    const childDynamic: Tag = {
      id: '3-dyn-1',
      text: 'Dynamic',
      selected: false,
      zone: 'Test',
      size: 40,
      parentId: '1',
      children: [],
      depth: 1,
    }
    parent.children = [childStatic, childDynamic]
    const allTags: Tag[] = [parent, childStatic, childDynamic]

    const result = removeDynamicChildren(parent, allTags)

    expect(parent.children).toEqual([childStatic])
    expect(result).toEqual([parent, childStatic])
  })
})
