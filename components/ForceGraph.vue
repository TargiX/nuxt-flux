/// <reference types="d3" />
<template>
  <div
    class="relative"
    ref="chartContainer"
    :data-zone="zone"
    :style="{ width: `${width}px`, height: `${height}px` }"
  >
    <div v-if="!preview" class="absolute bottom-4 right-4 flex gap-2">
      <button
        @click="handlePrevZone"
        class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200"
        :disabled="isFirstZone"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5 rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
        Prev
      </button>

      <button
        @click="handleNextZone"
        class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200"
        :disabled="isLastZone"
      >
        Next
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import * as d3 from 'd3'
import { useTagStore } from '~/store/tagStoreV2'
import type { Node } from '~/store/tagStoreV2'
import { graphUpdateEvent } from '~/store/tagStoreV2'

interface BaseNode {
  id: string
  text: string
  children: BaseNode[]
  metadata?: { loading?: boolean }
  selected: boolean
  zone: string
  hidden: boolean
  parentId: string | null
  x?: number
  y?: number
}

interface SimNode extends Omit<BaseNode, 'children'> {
  x: number
  y: number
  vx: number
  vy: number
  fx: number | null
  fy: number | null
  index?: number
  children: { id: string }[]
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: SimNode
  target: SimNode
  value: number
  index?: number
}

interface ZoneGraph {
  nodes: SimNode[]
  links: SimLink[]
  simulation: d3.Simulation<SimNode, SimLink>
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null
  node?: d3.Selection<SVGGElement, SimNode, SVGGElement, unknown>
  link?: d3.Selection<SVGLineElement, SimLink, SVGGElement, unknown>
  lastClickedNode: BaseNode | null
}

const props = defineProps<{
  width: number
  height: number
  zone: string
  preview?: boolean
  zoomConfig?: {
    scale: number
    translateX: number
    translateY: number
  }
}>()

const emit = defineEmits(['tagSelected', 'zoneChange'])
defineExpose({
  updateGraph: updateGraph
})

const chartContainer = ref<HTMLElement | null>(null)
const tagStore = useTagStore()

// Navigation computed properties
const isFirstZone = computed(() => {
  const index = tagStore.zones.indexOf(props.zone)
  return index === 0
})

const isLastZone = computed(() => {
  const index = tagStore.zones.indexOf(props.zone)
  return index === tagStore.zones.length - 1
})

// Navigation methods
const handlePrevZone = () => {
  const currentIndex = tagStore.zones.indexOf(props.zone)
  if (currentIndex > 0) {
    emit('zoneChange', tagStore.zones[currentIndex - 1])
  }
}

const handleNextZone = () => {
  const currentIndex = tagStore.zones.indexOf(props.zone)
  if (currentIndex < tagStore.zones.length - 1) {
    emit('zoneChange', tagStore.zones[currentIndex + 1])
  }
}

// Compute the current zone graph reference
const zoneGraph = computed(() => tagStore.getZoneGraph(props.zone))

// Handle graph update events
const handleGraphUpdate = (event: CustomEvent<{ zone: string }>) => {
  if (event.detail.zone === props.zone) {
    updateGraph()
  }
}

onMounted(async () => {
  // Fetch initial tags if needed
  if (!zoneGraph.value.nodes.length) {
    await tagStore.fetchTags()
  }
  createForceGraph()
  
  // Add event listener
  graphUpdateEvent.addEventListener('updateGraph', handleGraphUpdate as EventListener)
})

onBeforeUnmount(() => {
  // Remove event listener
  graphUpdateEvent.removeEventListener('updateGraph', handleGraphUpdate as EventListener)
})

// Create the force-directed graph
function createForceGraph() {
  if (!chartContainer.value) return
  const { width, height } = props

  // Initialize SVG
  zoneGraph.value.svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height])
    .style('width', '100%')
    .style('height', '100%')

  // Background to catch clicks
  zoneGraph.value.svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'none')
    .attr('pointer-events', 'all')
    .on('click', () => {
      // Clicking empty space could unselect all if desired, currently we do nothing special
    })

  const g = zoneGraph.value.svg.append('g')

  // Apply any zoom config passed via props
  if (props.zoomConfig) {
    g.attr('transform', `translate(${props.zoomConfig.translateX},${props.zoomConfig.translateY}) scale(${props.zoomConfig.scale})`)
  }

  g.append('g').attr('class', 'links')
  g.append('g').attr('class', 'nodes')

  // Initialize the simulation
  zoneGraph.value.simulation = d3.forceSimulation<SimNode>()
    .alphaDecay(0.05)
    .on('tick', onTick)

  addZoomBehavior()
  updateGraph()
}

function updateGraph() {
  const zg = zoneGraph.value;
  if (!zg.simulation || !zg.svg) return;

  zg.simulation.stop();

  // Convert BaseNodes to SimNodes
  console.log('this is tagStore.visibleNodes', tagStore.visibleNodes(props.zone))
  const nodes = tagStore.visibleNodes(props.zone).map(node => ({
    ...node, // Preserve all original node properties
    x: node.x || props.width / 2,
    y: node.y || props.height / 2,
    vx: 0,
    vy: 0,
    fx: node.fx || null,
    fy: node.fy || null,
    // Don't map children to just id, preserve all child properties
    children: node.children.map(child => ({
      ...child,
      x: child.x || props.width / 2,
      y: child.y || props.height / 2,
      vx: 0,
      vy: 0,
      fx: child.fx || null,
      fy: child.fy || null
    }))
  })) as SimNode[];

  // Overwrite zg.nodes with the latest nodes
  zg.nodes.value = nodes;

  // Generate links fresh each time
  const links = tagStore.createLinksFromNodes(nodes).map(link => {
    const sourceNode = nodes.find(n => n.id === (typeof link.source === 'object' ? link.source.id : link.source));
    const targetNode = nodes.find(n => n.id === (typeof link.target === 'object' ? link.target.id : link.target));
    
    if (!sourceNode || !targetNode) {
      console.warn('Missing source or target node for link:', link);
      return null;
    }

    return {
      source: sourceNode,
      target: targetNode,
      value: link.value || 1
    } as SimLink;
  }).filter((link): link is SimLink => link !== null);
 
  // Set zg.links
  zg.links.value = links;

  // Find parent nodes (nodes with children)
  const parentNodes = nodes.filter(n => n.children.length > 0);
  
  // Calculate positions for parent nodes to distribute them evenly
  parentNodes.forEach((parent, index) => {
    const angle = (index / parentNodes.length) * 2 * Math.PI;
    const radius = Math.min(props.width, props.height) * 0.3;
    const centerX = props.width / 2 + Math.cos(angle) * radius;
    const centerY = props.height / 2 + Math.sin(angle) * radius;
    parent.fx = centerX;
    parent.fy = centerY;
    
    // Position children in a circle around their parent
    if (parent.children.length > 0) {
      const childRadius = 80; // Distance from parent to children
      parent.children.forEach((child, childIndex) => {
        const childAngle = (childIndex / parent.children.length) * 2 * Math.PI;
        const childNode = nodes.find(n => n.id === child.id);
        if (childNode) {
          childNode.fx = centerX + Math.cos(childAngle) * childRadius;
          childNode.fy = centerY + Math.sin(childAngle) * childRadius;
        }
      });
    }
  });

  zg.simulation.nodes(nodes);

  // Adjust force parameters for more stability
  zg.simulation
    .force('link', d3.forceLink<SimNode, SimLink>(links)
      .id((d: SimNode) => d.id)
      .distance(80)
      .strength(1)
    )
    .force('charge', d3.forceManyBody<SimNode>()
      .strength(d => d.children.length > 0 ? -500 : -100)
      .distanceMax(200)
    )
    .force('collision', d3.forceCollide<SimNode>()
      .radius(d => d.children.length > 0 ? 50 : 30)
      .strength(1)
    )
    .force('x', d3.forceX<SimNode>(props.width / 2).strength(0.1))
    .force('y', d3.forceY<SimNode>(props.height / 2).strength(0.1));

  // Update links selection
  const linkSelection = zg.svg.select<SVGGElement>('.links')
    .selectAll<SVGLineElement, SimLink>('line')
    .data<SimLink>(links);

  // Remove old links
  linkSelection.exit().remove();

  // Add new links
  const linkEnter = linkSelection.enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', (d: SimLink) => Math.sqrt(d.value));

  zg.link = linkSelection.merge(linkEnter);

  // Update nodes
  const nodeSelection = zg.svg.select<SVGGElement>('.nodes')
    .selectAll<SVGGElement, SimNode>('g')
    .data<SimNode>(nodes);

  nodeSelection.exit().remove();

  // Update existing nodes
  nodeSelection.select('circle')
    .attr('fill', (d: SimNode) => d.selected ? '#4CAF50' : d3.schemeCategory10[0])
    .classed('loading-node', (d: SimNode) => Boolean(d.metadata?.loading))
    .attr('stroke', (d: SimNode) => d.metadata?.loading ? '#2196f3' : '#fff')
    .attr('stroke-width', (d: SimNode) => d.metadata?.loading ? 2 : 1.5)
    .attr('r', (d: SimNode) => d.children.length > 0 ? 25 : 20);

  const nodeEnter = nodeSelection.enter()
    .append('g')
    .call(drag(zg.simulation))
    .on('click', handleNodeClick);

  nodeEnter.append('circle')
    .attr('r', (d: SimNode) => d.children.length > 0 ? 25 : 20)
    .attr('fill', (d: SimNode) => d.selected ? '#4CAF50' : d3.schemeCategory10[0])
    .classed('loading-node', (d: SimNode) => Boolean(d.metadata?.loading))
    .attr('stroke', (d: SimNode) => d.metadata?.loading ? '#2196f3' : '#fff')
    .attr('stroke-width', (d: SimNode) => d.metadata?.loading ? 2 : 1.5);

  nodeEnter.each(function(this: SVGGElement, d: SimNode) {
    const node = d3.select(this);
    const lines = formatNodeText(d.text);
    lines.forEach((line, i) => {
      node.append('text')
        .text(line)
        .attr('x', 0)
        .attr('y', 20 + 10 + i * 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('class', 'node-text');
    });
  });

  nodeEnter.append('title').text((d: SimNode) => d.id);

  zg.node = nodeSelection.merge(nodeEnter);

  // Set a lower alpha decay for smoother transitions
  zg.simulation.alphaDecay(0.02).alpha(0.3).restart();
}

function onTick() {
  const zg = zoneGraph.value
  if (!zg.link || !zg.node) return

  // Update link positions
  zg.link
    .attr('x1', (d: SimLink) => Math.round((d.source.x || 0) * 100) / 100)
    .attr('y1', (d: SimLink) => Math.round((d.source.y || 0) * 100) / 100)
    .attr('x2', (d: SimLink) => Math.round((d.target.x || 0) * 100) / 100)
    .attr('y2', (d: SimLink) => Math.round((d.target.y || 0) * 100) / 100);

  // Update node positions with damping for smoother movement
  zg.node.attr('transform', (d: SimNode) => {
    // Apply damping to velocity
    if (d.vx) d.vx *= 0.7;
    if (d.vy) d.vy *= 0.7;
    
    // Round positions for stability
    const x = Math.round((d.x || 0) * 100) / 100;
    const y = Math.round((d.y || 0) * 100) / 100;
    
    return `translate(${x},${y})`;
  });
}

function handleNodeClick(event: MouseEvent, d: SimNode) {
  console.log('this is d', d)
  if (props.preview) return
  event.stopPropagation()
  
  // Toggle node selection in store
  tagStore.toggleNodeSelection(props.zone, d.id)
  
  // Emit event for parent components
  emit('tagSelected', d.id, props.zone)
}

function drag(simulation: d3.Simulation<SimNode, undefined>) {
  function dragstarted(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event: d3.D3DragEvent<SVGGElement, SimNode, SimNode>) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }

  return d3.drag<SVGGElement, SimNode>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)
}

function addZoomBehavior() {
  const zg = zoneGraph.value;
  if (!zg.svg) return;

  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 2])
    .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      zg.svg?.select('g').attr('transform', event.transform.toString());
    });

  zg.svg.call(zoom);
}

// Simple text formatting: keep text readable
function formatNodeText(text: string): string[] {
  const words = text.split(' ')
  // Basic formatting: return as is, or split into multiple lines if long
  if (words.length <= 2) return [text]

  // If text is longer, split into multiple lines (roughly in half)
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

</script>


<style scoped>
div {
  display: inline-block;
}

@keyframes loadingPulse {
  0% {
    fill: #4caf50;
    fill-opacity: 1;
    stroke-opacity: 1;
  }
  50% {
    fill: #2196f3;
    fill-opacity: 0.7;
    stroke-opacity: 0.7;
  }
  100% {
    fill: #4caf50;
    fill-opacity: 1;
    stroke-opacity: 1;
  }
}

::v-deep circle.loading-node {
  animation: loadingPulse 1.5s ease-in-out infinite;
}

::v-deep .nodes g[data-is-hybrid='true'] circle {
  stroke: #4caf50;
  stroke-width: 2;
  stroke-dasharray: 4;
  fill-opacity: 0.3;
}

/* Add to existing styles */
::v-deep .nodes g {
  transition: opacity 0.6s ease;
}

::v-deep .links line {
  transition: opacity 0.6s ease;
}

/* Add to existing styles */
.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.bottom-4 {
  bottom: 1rem;
}

.right-4 {
  right: 1rem;
}

button {
  z-index: 10;
}

.flex {
  display: flex;
}

.gap-2 {
  gap: 0.5rem;
}

.rotate-180 {
  transform: rotate(180deg);
}

button:disabled {
  opacity: 0.7;
}

button:disabled:hover {
  background-color: #9ca3af; /* Tailwind's gray-400 */
}

/* Add to existing styles */
::v-deep .node-text {
  pointer-events: none; /* Prevents text from interfering with click events */
  user-select: none; /* Prevents text selection */
}
</style>
