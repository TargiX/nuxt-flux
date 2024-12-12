<template>
  <div
    class="relative"
    ref="chartContainer"
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
import { ref, onMounted, watch, computed } from 'vue'
import * as d3 from 'd3'
import { useTagStore } from '~/store/tagStoreV2'
import type { Tag } from '~/store/tagStoreV2' // Import Tag type
import type { Node } from '~/store/tagStoreV2'

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

// Listen to changes in visible nodes for this zone and update the graph accordingly
// watch(() => tagStore.visibleNodes(props.zone), updateGraph, { deep: true })

// Compute the current zone graph reference
const zoneGraph = computed(() => tagStore.getZoneGraph(props.zone))

onMounted(async () => {
  // Fetch initial tags if needed
  if (!zoneGraph.value.nodes.length) {
    await tagStore.fetchTags()
  }
  createForceGraph()
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
  zoneGraph.value.simulation = d3.forceSimulation<Node>()
    .alphaDecay(0.05)
    .on('tick', onTick)

  addZoomBehavior()
  updateGraph()
}

function updateGraph() {
  const zg = zoneGraph.value;
  if (!zg.simulation || !zg.svg) return;

  zg.simulation.stop();

  const nodes = tagStore.visibleNodes(props.zone);
  // Overwrite zg.nodes with the latest nodes
  zg.nodes = nodes;

  // Generate links fresh each time
  const links = tagStore.createLinksFromNodes(zg.nodes);
 

  // Set zg.links
  zg.links = links;

  zg.simulation.nodes(nodes);

  zg.simulation.force(
    'link',
    d3.forceLink<Node, { source: Node; target: Node; value: number }>(links)
      .id(d => d.id)
      .distance(150)
      .strength(0.3)
  )
  .force('charge', d3.forceManyBody().strength(-30).distanceMax(200))
  .force('collision', d3.forceCollide<Node>().radius(() => 30).strength(0.4))
  .force('center', d3.forceCenter(props.width / 2, props.height / 2).strength(0.3));

  // Update links selection
  const linkSelection = zg.svg.select('.links')
    .selectAll('line')
    .data(links, d => `${d.source.id}-${d.target.id}`);

  // Remove old links
  linkSelection.exit().remove();

  // Add new links
  linkSelection.enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', d => Math.sqrt(d.value || 1));

  zg.link = zg.svg.select('.links').selectAll('line');

  // Update nodes
  const nodeSelection = zg.svg.select('.nodes')
    .selectAll<SVGGElement, Node>('g')
    .data(nodes, d => d.id);

  nodeSelection.exit().remove();

  const nodeEnter = nodeSelection.enter()
    .append('g')
    .call(drag(zg.simulation))
    .on('click', handleNodeClick);

  nodeEnter.append('circle')
    .attr('r', 20)
    .attr('fill', d => d.selected ? '#4CAF50' : d3.schemeCategory10[0])
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);

  nodeEnter.each(function(d) {
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

  nodeEnter.append('title').text(d => d.id);

  zg.node = zg.svg.select('.nodes').selectAll('g');

  zg.simulation.alpha(0.3).restart();
}

function onTick() {
  const zg = zoneGraph.value
  if (!zg.link || !zg.node) return

  zg.link
    .attr('x1', d => d.source.x || 0)
    .attr('y1', d => d.source.y || 0)
    .attr('x2', d => d.target.x || 0)
    .attr('y2', d => d.target.y || 0)

  zg.node.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`)
}

function handleNodeClick(event: MouseEvent, d: Node) {
  if (props.preview) return
  event.stopPropagation()
  // Toggle selection state via store
  // tagStore.toggleNodeSelection(props.zone, d.id)
  console.log('this is d', d)
  emit('tagSelected', d.id, props.zone)
}

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart()
    event.subject.fx = event.subject.x
    event.subject.fy = event.subject.y
  }

  function dragged(event) {
    event.subject.fx = event.x
    event.subject.fy = event.y
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0)
    event.subject.fx = null
    event.subject.fy = null
  }

  return d3.drag<SVGGElement, Node>()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended)
}

function addZoomBehavior() {
  const zg = zoneGraph.value
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 2])
    .on('zoom', (event) => {
      zg.svg.select('g').attr('transform', event.transform)
    })

  zg.svg.call(zoom)
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
  }
  25% {
    fill: #2196f3;
  }
  50% {
    fill: #4caf50;
  }
  75% {
    fill: #2196f3;
  }
  100% {
    fill: #4caf50;
  }
}

/* Use ::v-deep to target elements inside the SVG */
::v-deep .loading-node circle {
  animation: loadingPulse 1s infinite;
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
