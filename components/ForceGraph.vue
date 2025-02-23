<template>
  <div ref="container" :style="{ width: `${width}px`, height: `${height}px` }">
    <div class="zoom-controls absolute bottom-4 right-4 flex gap-2">
      <button 
        @click="() => svg && zoomInFn(svg)"
        class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md"
      >
        +
      </button>
      <button 
        @click="() => svg && zoomOutFn(svg)"
        class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md"
      >
        -
      </button>
      <button 
        @click="() => svg && resetZoomFn(svg)"
        class="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
      >
        Reset
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import { useZoom } from '~/composables/useZoom';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  text: string;
  size: number;
  selected: boolean;
  zone: string;
  alias: string;
  children?: GraphNode[];
  parentId?: string;
  x?: number;
  y?: number;
  isLoading?: boolean;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  value: number;
}

const props = defineProps<{
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
}>();

const emit = defineEmits(['nodeClick', 'nodePositionsUpdated']);
const container = ref<HTMLElement | null>(null);
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let linkGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
let nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

// Use the zoom composable
const { initializeZoom, zoomIn: zoomInFn, zoomOut: zoomOutFn, resetZoom: resetZoomFn } = useZoom();

onMounted(() => {
  initializeGraph();
});

onBeforeUnmount(() => {
  saveNodePositions();
});

watch(
  () => [props.nodes.map(n => ({ id: n.id, text: n.text, size: n.size, children: n.children?.map(c => c.id) || [] })), props.links.map(l => ({ source: l.source.id, target: l.target.id, value: l.value }))],
  (newVal, oldVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(oldVal)) {
      console.log('Graph updating due to structural change');
      updateGraph();
    }
  },
  { deep: true }
);

function initializeGraph() {
  if (!container.value) return;

  svg = d3.select(container.value)
    .append('svg')
    .attr('width', props.width)
    .attr('height', props.height)
    .attr('style', 'border: 1px solid #ccc');

  // Create a root group for zoom
  const g = svg.append('g')
    .attr('class', 'zoom-group');

  linkGroup = g.append('g').attr('class', 'links');
  nodeGroup = g.append('g').attr('class', 'nodes');

  // Initialize zoom using the composable
  initializeZoom(svg, g);

  simulation = d3.forceSimulation<GraphNode>(props.nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(props.links).id(d => d.id).distance(50).strength(0.15))
    .force('charge', d3.forceManyBody().strength(-20))
    .force('center', d3.forceCenter(props.width / 2, props.height / 2).strength(0.00))
    .force('collision', d3.forceCollide().radius(d => d.size / 2 + 20))
    .velocityDecay(0.8);

  simulation.nodes().forEach(node => {
    node.x = node.x || props.width / 2;
    node.y = node.y || props.height / 2;
    node.vx = 0;
    node.vy = 0;
    if (!node.parentId) {
      node.fx = node.x;
      node.fy = node.y;
    }
  });

  setupSimulation();
  updateLinks();
  updateNodes();

  simulation.alpha(0.1).restart();
  setTimeout(() => {
    simulation.nodes().forEach(node => {
      if (!node.parentId) {
        node.fx = null;
        node.fy = null;
      }
    });
  }, 500);
}

function setupSimulation() {
  if (!simulation || !linkGroup || !nodeGroup) return;

  simulation.on('tick', () => {
    linkGroup.selectAll<SVGLineElement, GraphLink>('line')
      .attr('x1', d => (d.source as GraphNode).x || 0)
      .attr('y1', d => (d.source as GraphNode).y || 0)
      .attr('x2', d => (d.target as GraphNode).x || 0)
      .attr('y2', d => (d.target as GraphNode).y || 0);

    nodeGroup.selectAll<SVGGElement, GraphNode>('g')
      .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
  });
}

function updateGraph() {
  if (!svg || !simulation) return;

  simulation.stop();

  const selectedParent = props.nodes.find(n => n.selected && !n.parentId);
  const parentX = selectedParent ? (selectedParent.x || props.width / 2) : props.width / 2;
  const parentY = selectedParent ? (selectedParent.y || props.height / 2) : props.height / 2;

  props.nodes.forEach(node => {
    if (node.selected && !node.parentId) {
      node.fx = node.x || parentX;
      node.fy = node.y || parentY;
    } else if (node.parentId) {
      const parent = props.nodes.find(n => n.id === node.parentId);
      if (parent && (!node.x || !node.y)) {
        node.x = parent.x || parentX;
        node.y = parent.y || parentY;
        node.vx = 0;
        node.vy = 0;
      }
    } else {
      node.fx = null;
      node.fy = null;
    }
  });

  simulation.nodes(props.nodes);
  simulation.force('link')?.links(props.links);
  simulation.alpha(0.3).restart();

  updateLinks();
  updateNodes();

  setTimeout(() => {
    if (selectedParent) {
      selectedParent.fx = null;
      selectedParent.fy = null;
    }
  }, 300);
}

function updateLinks() {
  if (!linkGroup) return;

  const link = linkGroup.selectAll<SVGLineElement, GraphLink>('line')
    .data(props.links, d => `${d.source.id}-${d.target.id}`);

  link.enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-opacity', 0.6)
    .attr('stroke-width', d => Math.sqrt(d.value))
    .merge(link);

  link.exit().remove();
}

function updateNodes() {
  if (!nodeGroup || !simulation) return;

  const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
    .data(props.nodes, d => d.id);

  const nodeEnter = node.enter()
    .append('g')
    .attr('class', 'node')
    .call(drag(simulation))
    .on('click', (event, d) => {
      console.log('Node clicked:', d.id);
      emit('nodeClick', d.id);
      updateNodeSelection(d.id);
    });

  nodeEnter.append('circle')
    .attr('r', d => d.size / 2)
    .attr('fill', d => d.selected ? '#4CAF50' : '#ccc')
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5);

  nodeEnter.append('text')
    .text(d => d.text)
    .attr('text-anchor', 'middle')
    .attr('dy', d => d.size / 2 + 10)
    .attr('font-size', '10px');

  node.exit().remove();
}

function updateNodeSelection(id: string) {
  if (!nodeGroup) return;

  const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
    .filter(d => d.id === id);

  node.select('circle')
    .attr('fill', d => {
      console.log(`Updating ${d.id} fill: ${d.selected ? '#4CAF50' : '#ccc'}`);
      return d.selected ? '#4CAF50' : '#ccc';
    });
}

function saveNodePositions() {
  if (!simulation) return;
  const updatedPositions = simulation.nodes().map(node => ({
    id: node.id,
    x: node.x,
    y: node.y
  }));
  console.log('Emitting updated positions:', updatedPositions);
  emit('nodePositionsUpdated', updatedPositions);
}

function drag(sim: d3.Simulation<GraphNode, GraphLink>) {
  return d3.drag<SVGGElement, GraphNode>()
    .on('start', (event) => {
      if (!event.active) sim.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    })
    .on('drag', (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    })
    .on('end', (event) => {
      if (!event.active) sim.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    });
}
</script>

<style scoped>
.node {
  cursor: pointer;
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

.flex {
  display: flex;
}

.gap-2 {
  gap: 0.5rem;
}

.zoom-controls button {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.zoom-controls button:last-child {
  width: auto;
  padding: 0 12px;
}
</style>