export interface Tag {
  id: string
  text: string
  size: number
  selected: boolean
  zone: string
  alias: string
  children?: Tag[]
  parentId?: string
  x?: number
  y?: number
  isLoading?: boolean
  depth?: number
  isTransformed?: boolean // Mark if tag was transformed via context menu
  originalText?: string // Store original text before transformation
  imageUrl?: string // URL for the tag's generated icon
}
