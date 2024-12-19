import { defineStore } from 'pinia'
import { shallowRef, type Ref } from 'vue'
import * as d3 from 'd3'

// Import mockTags and define MockTag interface
import { mockTags } from './mockTags'

interface MockTag {
  text: string
  children: { text: string }[]
}

interface MockTags {
  [key: string]: MockTag[]
}

// Create a simple event emitter
export const graphUpdateEvent = new EventTarget()

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
  nodes: Ref<Node[]>
  links: Ref<{ source: Node; target: Node; value: number }[]>
  simulation: d3.Simulation<any, undefined> | null
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null
  node: d3.Selection<SVGGElement, Node, SVGGElement, unknown> | null
  link: d3.Selection<SVGLineElement, { source: Node; target: Node; value: number }, SVGGElement, unknown> | null
  lastClickedNode: Node | null
}

// Helper constants
const DEFAULT_WIDTH = 600
const DEFAULT_HEIGHT = 728

export const useTagStore = defineStore('tags', {
  state: () => ({
    zones: Object.keys(mockTags as MockTags),
    zoneGraphs: Object.fromEntries(
      Object.keys(mockTags as MockTags).map((zone) => [
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
          if (!node) return
          if (!node.hidden) {
            result.push(node)
            if (Array.isArray(node.children)) {
              node.children.forEach(traverse)
            }
          }
        }
        const zoneGraph = state.zoneGraphs[zone]
        if (!zoneGraph?.nodes?.value) {
          console.warn('No nodes found for zone:', zone)
          return []
        }
        zoneGraph.nodes.value.forEach(traverse)
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
        const nodes = state.zoneGraphs[zone]?.nodes?.value || []
        nodes.forEach(traverse)
      }
      return allSelected
    },
  },
  actions: {
    async fetchTags() {
      console.log('Fetching tags...')
      // Convert mockTags into Node structure
      for (const zone of this.zones) {
        console.log('Processing zone:', zone)
        const zoneTags = (mockTags as MockTags)[zone]
        const topNodes = zoneTags.map((item: MockTag, index: number) => {
          const id = `${zone.toLowerCase()}-${index + 1}`
          const children = item.children?.map((sec: { text: string }, i: number) => {
            const childId = `${id}-${i + 1}`
            return {
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
            } as Node
          }) || []

          return {
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
          } as Node
        })

        console.log('Created nodes for zone:', zone, topNodes)
        if (this.zoneGraphs[zone]) {
          this.zoneGraphs[zone].nodes.value = topNodes
        }
      }
    },

    unselectAllNodesInZone(zone: string) {
      const traverse = (node: Node) => {
        if (!node) return
        node.selected = false
        if (Array.isArray(node.children)) {
          node.children.forEach(traverse)
        }
      }
      
      const zoneGraph = this.zoneGraphs[zone]
      if (!zoneGraph?.nodes?.value) {
        console.warn('No nodes found for zone:', zone)
        return
      }
      
      zoneGraph.nodes.value.forEach(traverse)
    },

    findNode(zone: string, nodeId: string): Node | null {
      // Get nodes from the zone graph
      const zoneGraph = this.zoneGraphs[zone]
      if (!zoneGraph) {
        console.warn('Zone graph not found:', zone)
        return null
      }

      const nodes = zoneGraph.nodes.value
      console.log('Finding node in zone:', zone, 'nodes:', nodes)

      if (!Array.isArray(nodes)) {
        console.warn('Nodes is not an array:', nodes)
        return null
      }

      const traverse = (nodeList: Node[]): Node | null => {
        for (const node of nodeList) {
          if (node.id === nodeId) return node
          if (Array.isArray(node.children)) {
            const found = traverse(node.children)
            if (found) return found
          }
        }
        return null
      }

      return traverse(nodes)
    },

    setFocusedZone(zone: string) {
      this.focusedZone = zone
    },

    // Helper method to trigger graph updates
    triggerGraphUpdate(zone: string) {
      console.log('this is triggerGraphUpdate', zone)
      graphUpdateEvent.dispatchEvent(new CustomEvent('updateGraph', { detail: { zone } }))
    },

    setNodeLoading(nodeId: string, loading: boolean) {
      for (const zone of this.zones) {
        const node = this.findNode(zone, nodeId)
        if (node) {
          node.metadata = node.metadata || {}
          node.metadata.loading = loading
          this.triggerGraphUpdate(zone)
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
      this.triggerGraphUpdate(zone)
    },

    removeDynamicChildren(zone: string, parentId: string) {
      const parent = this.findNode(zone, parentId)
      if (!parent) return
  
      parent.children = parent.children.filter(child => {
        return !(child.metadata && child.metadata.dynamic)
      })
      this.triggerGraphUpdate(zone)
    },

    toggleNodeSelection(zone: string, nodeId: string) {
      const node = this.findNode(zone, nodeId)
      console.log('this is node', node)
      if (!node) {
        console.warn(`Node ${nodeId} not found in zone ${zone}`)
        return
      }

      // Unselect all other nodes first if we're selecting this node
      if (!node.selected) {
        this.unselectAllNodesInZone(zone)
      }

      // Toggle the selection
      node.selected = !node.selected

      // If node is now selected, position it and its children
      if (node.selected) {
        this.positionNodeAtCenter(node)
        // Make children visible before laying them out
        node.children.forEach(child => {
          child.hidden = false
        })
        this.layoutChildrenCircularly(node)
      } else {
        // If node is unselected, hide its children and reset its fixed position
        node.children.forEach(child => {
          child.hidden = true
        })
        node.fx = null
        node.fy = null
      }

      this.triggerGraphUpdate(zone)
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
        // Ensure parent.children exists and is an array
        if (!parent || !Array.isArray(parent.children)) {
          return;
        }

        // Only process visible children
        const visibleChildren = parent.children.filter(child => child && !child.hidden);
        
        visibleChildren.forEach(child => {
          // Only create a link if the child has a parentId
          if (child && child.parentId) {
            links.push({
              source: parent,
              target: child,
              value: 1
            });
          }
          // Continue traversing with visible children
          traverse(child);
        });
      };
    
      // Only traverse visible root nodes
      const visibleRootNodes = (rootNodes || []).filter(node => node && !node.hidden);
      visibleRootNodes.forEach(traverse);
      
      return links;
    },

    // Example: add AI-generated children to a node (hybrid)
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
      
      this.triggerGraphUpdate(zone)
    },

    resetZoneGraphLayout(zone: string) {
      // Optionally reset fixed positions or do a simulation restart
      const zoneGraph = this.zoneGraphs[zone]
      if (zoneGraph?.simulation) {
        zoneGraph.simulation.alpha(0.3).restart()
      }
    },
  },
})
