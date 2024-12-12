import { defineStore } from 'pinia'
import { shallowRef } from 'vue'
import * as d3 from 'd3'

import { mockTags } from './mockTags'

// NodeMetadata for additional info
interface NodeMetadata {
  origin?: 'preconfigured' | 'user' | 'ai-generated'
  sourceNodeIds?: string[] // For hybrid nodes, store source node IDs
  loading?: boolean
  dynamic?: boolean
}

export interface Node {
  id: string
  text: string
  zone: string
  selected: boolean
  hidden: boolean
  x: number | null
  y: number | null
  fx: number | null
  fy: number | null
  parentId: string | null
  children: Node[]
  metadata: NodeMetadata
  vx?: number
  vy?: number
}

interface ZoneGraph {
  nodes: Node[]
  links: { source: Node; target: Node; value: number }[]
  simulation: d3.Simulation<any, undefined> | null
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null
  node?: d3.Selection<SVGGElement, Node, SVGGElement, unknown>
  link?: d3.Selection<
    SVGLineElement,
    { source: Node; target: Node; value: number },
    SVGGElement,
    unknown
  >
  lastClickedNode: Node | null
}

// Helper constants
const DEFAULT_WIDTH = 600
const DEFAULT_HEIGHT = 728

export const useTagStore = defineStore('tags', {
  state: () => ({
    zones: Object.keys(mockTags),
    zoneGraphs: Object.fromEntries(
      Object.keys(mockTags).map((zone) => [
        zone,
        {
          nodes: shallowRef<Node[]>([]),
          links: shallowRef<{ source: Node; target: Node; value: number }[]>([]),
          simulation: null,
          svg: null,
          lastClickedNode: null,
          node: null,
          link: null,
        } as ZoneGraph,
      ])
    ),
    focusedZone: 'Subject' as string,
  }),
  getters: {
    getZoneGraph:
      (state) =>
      (zone: string): ZoneGraph => {
        return state.zoneGraphs[zone]
      },
    visibleNodes:
      (state) =>
      (zone: string): Node[] => {
        // Traverse the zone's top-level nodes and return all visible nodes
        const result: Node[] = []
        const traverse = (node: Node) => {
          if (!node.hidden) {
            result.push(node)
            node.children.forEach(traverse)
          }
        }
        state.zoneGraphs[zone].nodes.forEach(traverse)
        return result
      },
    selectedNodes: (state) => {
      const allSelected: Node[] = []
      for (const zone of state.zones) {
        const traverse = (node: Node) => {
          if (node.selected && !node.hidden) {
            allSelected.push(node)
          }
          node.children.forEach(traverse)
        }
        state.zoneGraphs[zone].nodes.forEach(traverse)
      }
      return allSelected
    },
  },
  actions: {
    async fetchTags() {
      // Convert mockTags into Node structure
      for (const zone of this.zones) {
        console.log('zone', zone)
        console.log('mockTags', mockTags[zone])
        const topNodes = mockTags[zone].map((item, index) => {
          const id = `${zone}-${index}`
          const children = item.children.map((sec, i) => {
            const childId = `${id}-child-${i}`
            return <Node>{
              id: childId,
              text: sec.text,
              zone,
              selected: false,
              hidden: true,
              x: null,
              y: null,
              fx: null,
              fy: null,
              parentId: id,
              children: [],
              metadata: { origin: 'preconfigured', dynamic: false, loading: false },
            }
          })
          return <Node>{
            id,
            text: item.text,
            zone,
            selected: false,
            hidden: false,
            x: null,
            y: null,
            fx: null,
            fy: null,
            parentId: null,
            children,
            metadata: { origin: 'preconfigured', dynamic: false, loading: false },
          }
        })
        console.log('this is zoneGraphs[zone]', this.zoneGraphs[zone].nodes)
        this.zoneGraphs[zone].nodes = topNodes
      }
     
    },

    setFocusedZone(zone: string) {
      this.focusedZone = zone
    },

    setNodeLoading(nodeId: string, loading: boolean) {
      // Find the node in any zone
      for (const zone of this.zones) {
        const node = this.findNode(zone, nodeId)
        if (node) {
          node.metadata = node.metadata || {}
          // Use a `loading` property in metadata to represent loading state
          node.metadata.loading = loading
          return
        }
      }
    },

    addChildNode(zone: string, parentId: string, child: Node) {
      const parent = this.findNode(zone, parentId)
      if (!parent) {
        console.error(`Parent node ${parentId} not found in zone ${zone}`)
        return
      }
  
      parent.children.push(child)
    },

    removeDynamicChildren(zone: string, parentId: string) {
      const parent = this.findNode(zone, parentId)
      if (!parent) return
  
      parent.children = parent.children.filter(child => {
        // If `metadata.dynamic` is used to mark dynamic children, filter them out
        return !(child.metadata && child.metadata.dynamic)
      })
    },

    toggleNodeSelection(zone: string, nodeId: string) {
      console.log('this is find node', this.findNode(zone, nodeId))
      const node = this.findNode(zone, nodeId)
      console.log('this is node selected', node)
      if (!node) return

      // If selecting a node in this zone, we might unselect others
      if (!node.selected) {
        this.unselectAllNodesInZone(zone)
      }
      console.log('this is node selected before', node)
      node.selected = !node.selected
      if (node.selected) {
        // Position at center and layout children
        console.log('this is node selected', node)
        this.positionNodeAtCenter(node)
        this.layoutChildrenCircularly(node)
      } else {
        node.fx = null
        node.fy = null
      }
      console.log('this is all zone tags after selection', this.zoneGraphs[zone].nodes)
    },

    unselectAllNodesInZone(zone: string) {
      const traverse = (node: Node) => {
        node.selected = false
        node.children.forEach(traverse)
      }
      this.zoneGraphs[zone].nodes.forEach(traverse)
    },

    findNode(zone: string, nodeId: string): Node | null {
      const traverse = (nodes: Node[]): Node | null => {
        for (const n of nodes) {
          if (n.id === nodeId) return n
          const found = traverse(n.children)
          if (found) return found
        }
        return null
      }
      return traverse(this.zoneGraphs[zone].nodes)
    },

    positionNodeAtCenter(node: Node) {
      const centerX = DEFAULT_WIDTH / 2
      const centerY = DEFAULT_HEIGHT / 2
      node.x = centerX
      node.y = centerY
      node.fx = centerX
      node.fy = centerY
    },

    layoutChildrenCircularly(parentNode: Node) {
      const children = parentNode.children
      if (!children.length) return

      const radius = 130
      const angleStep = (2 * Math.PI) / children.length
      const centerX = parentNode.x || DEFAULT_WIDTH / 2
      const centerY = parentNode.y || DEFAULT_HEIGHT / 2

      children.forEach((child, i) => {
        const angle = i * angleStep
        const childX = centerX + Math.cos(angle) * radius
        const childY = centerY + Math.sin(angle) * radius
        child.x = childX
        child.y = childY
        child.fx = childX
        child.fy = childY
        child.vx = 0
        child.vy = 0
      })
    },

    // Create links by traversing the tree
    createLinksFromNodes(rootNodes: Node[]): { source: Node; target: Node; value: number }[] {
      const links: { source: Node; target: Node; value: number }[] = [];
    
      const traverse = (parent: Node) => {
        parent.children.forEach(child => {
          // Only create a link if the child has a parentId and is not hidden
          if (child.parentId && !child.hidden) {
            links.push({ source: parent, target: child, value: 1 });
          }
          traverse(child);
        });
      };
    
      rootNodes.forEach(traverse);
      return links
    },

    // Example: add AI-generated children to a node (hybrid)
    // In a real scenario, you'd call your AI API here
    async createHybridChildren(
      zone: string,
      parentId: string,
      sourceNodeIds: string[],
      texts: string[]
    ) {
      const parentNode = this.findNode(zone, parentId)
      if (!parentNode) return
      const timestamp = Date.now()

      const newChildren = texts.map(
        (t, i) =>
          <Node>{
            id: `hybrid-${timestamp}-${i}`,
            text: t,
            zone,
            selected: false,
            hidden: false,
            x: null,
            y: null,
            fx: null,
            fy: null,
            parentId: parentNode.id,
            children: [],
            metadata: { origin: 'ai-generated', sourceNodeIds },
          }
      )

      parentNode.children.push(...newChildren)

      // Layout them if parent is selected
      if (parentNode.selected) {
        this.layoutChildrenCircularly(parentNode)
      }
    },

    resetZoneGraphLayout(zone: string) {
      // Optionally reset fixed positions or do a simulation restart
      const zoneGraph = this.zoneGraphs[zone]
      if (zoneGraph.simulation) {
        zoneGraph.simulation.alpha(0.3).restart()
      }
    },
  },
})
