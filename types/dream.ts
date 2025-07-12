import type { GeneratedImage } from '@prisma/client'

export interface Dream {
  id: number
  createdAt: string // ISO date string
  title: string | null
  data: Record<string, unknown>
  images: GeneratedImage[]
}

export interface DreamSummary {
  id: number
  createdAt: string // ISO date string
  title: string | null
}
