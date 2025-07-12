import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3'

/**
 * Represents a node in the force-directed graph
 */
export interface GraphNode extends SimulationNodeDatum {
  id: string
  text: string
  size: number
  selected: boolean
  zone: string
  alias: string
  children?: GraphNode[]
  parentId?: string
  x?: number
  y?: number
  isLoading?: boolean
  imageUrl?: string
  bypassed?: boolean
}

/**
 * Represents a link between nodes in the force-directed graph
 */
export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  value: number
}
