<template>
  <div class="force-graph-component relative" ref="container" :style="{ width: `${width}px`, height: `${height}px` }">
    <!-- D3 SVG will be appended here -->
    
    <!-- Controls container -->
    <div class="controls-overlay absolute bottom-4 left-4 right-4 justify-between items-center">
      <!-- Slot for additional controls like zone selector -->
          <!-- Existing Zoom controls -->
      <div class="zoom-controls flex justify-end flex-col gap-2 w-7 ml-auto mb-5">
        <Button 
          @click="() => svg && zoomInFn(svg)"
          severity="secondary"
          size="small"
          class="w-7 h-7"
          aria-label="Zoom In"
        >
          +
        </Button>
        <Button 
          @click="() => svg && zoomOutFn(svg)"
          severity="secondary"
          size="small"
          class="w-7 h-7"
          aria-label="Zoom Out"
        >
          -
        </Button>
        <Button 
          @click="() => svg && resetZoomFn(svg)"
          severity="secondary"
          size="small"
          class="!w-7 !h-7"
          aria-label="Reset Zoom"
          icon="pi pi-sync"
        />
      </div>
      <div >
      <div class="additional-controls flex-grow">
        <slot name="controls"></slot>
      </div>
     </div>
   
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import { useZoom } from '~/composables/useZoom';
import type { SimulationNodeDatum } from 'd3';

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
const { initializeZoom, zoomIn: zoomInFn, zoomOut: zoomOutFn, resetZoom: resetZoomFn, centerOnNode } = useZoom();

onMounted(() => {
  initializeGraph();
});

onBeforeUnmount(() => {
  saveNodePositions();
});

watch(
  () => [
    props.nodes.map(n => ({ id: n.id, text: n.text, size: n.size, children: n.children?.map(c => c.id) || [] })),
    props.links.map(l => ({ 
      source: (l.source as GraphNode).id,
      target: (l.target as GraphNode).id,
      value: l.value 
    }))
  ],
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

  // Create a root group for zoom
  const g = svg.append('g')
    .attr('class', 'zoom-group');

  linkGroup = g.append('g').attr('class', 'links');
  nodeGroup = g.append('g').attr('class', 'nodes');

  // Initialize zoom using the composable
  initializeZoom(svg, g);

  simulation = d3.forceSimulation<GraphNode>(props.nodes)
    .force('link', d3.forceLink<GraphNode, GraphLink>(props.links)
      .id(d => d.id)
      .distance(link => {
        const target = link.target as GraphNode;
        const source = link.source as GraphNode;
        // Increase distance when target is selected
        if (target.selected) return 150;
        // Keep parent-child relationships closer
        if (target.parentId === source.id) return 50;
        return 140;
      })
      .strength(link => {
        const target = link.target as GraphNode;
        const source = link.source as GraphNode;
        // Weaken link when target is selected
        if (target.selected) return 0.05;
        // Stronger force for parent-child relationships
        if (target.parentId === source.id) return 0.1;
        return 0.15;
      }))
    .force('charge', d3.forceManyBody()
      .strength((d) => ((d as GraphNode).selected ? -100 : -20))) // Stronger repulsion for selected nodes
    .force('center', d3.forceCenter(props.width / 2, props.height / 2).strength(0.00))
    .force('collision', d3.forceCollide()
      .radius((d) => ((d as GraphNode).selected ? (d as GraphNode).size : (d as GraphNode).size / 2) + 20)) // Larger collision radius for selected nodes
    .velocityDecay(0.8);

  if (simulation) {
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
      if (simulation) {
        simulation.nodes().forEach(node => {
          if (!node.parentId) {
            node.fx = null;
            node.fy = null;
          }
        });
      }
    }, 500);
  }
}

function setupSimulation() {
  if (!simulation || !linkGroup || !nodeGroup) return;

  simulation.on('tick', () => {
    if (linkGroup) {
      linkGroup.selectAll<SVGLineElement, GraphLink>('line')
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);
    }
    if (nodeGroup) {
      nodeGroup.selectAll<SVGGElement, GraphNode>('g')
        .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    }
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
  const linkForceTyped = simulation.force<d3.ForceLink<GraphNode, GraphLink>>('link');
  if (linkForceTyped) {
    linkForceTyped.links(props.links);
    linkForceTyped
      .distance(link => {
        const target = link.target as GraphNode;
        const source = link.source as GraphNode;
        if (target.selected) return 150;
        if (target.parentId === source.id) return 50;
        return 100;
      })
      .strength(link => {
        const target = link.target as GraphNode;
        const source = link.source as GraphNode;
        if (target.selected) return 0.05;
        if (target.parentId === source.id) return 0.3;
        return 0.15;
      });
  }

  const chargeForce = simulation.force('charge') as d3.ForceManyBody<GraphNode>;
  if (chargeForce) {
    chargeForce.strength((d: SimulationNodeDatum) => ((d as GraphNode).selected ? -100 : -20));
  }

  const collisionForce = simulation.force('collision') as d3.ForceCollide<GraphNode>;
  if (collisionForce) {
    collisionForce.radius((d: SimulationNodeDatum) => ((d as GraphNode).selected ? (d as GraphNode).size : (d as GraphNode).size / 2) + 20);
  }

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
    .data(props.links, d => {
      const sourceId = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source;
      const targetId = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target;
      return `${sourceId}-${targetId}`;
    });

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
      // Center on the clicked node with smooth transition
      if (svg) {
        centerOnNode(svg, d, props.width, props.height);
      }
    });

  nodeEnter.append('circle')
    .attr('r', d => d.size / 2)
    .attr('fill', d => d.selected ? '#6366f1' : '#ccc')
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
      return d.selected ? '#6366f1' : '#ccc';
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

<style lang="scss" scoped>
.force-graph-component {
  position: relative;
  width: 100%;
  height: 100%;
  svg {
    display: block;
    width: 100%;
    height: 100%;
    border: none !important;
  }
}

.node {
  cursor: pointer;
}

.absolute { position: absolute; }
.bottom-4 { bottom: 1rem; }
.left-4 { left: 1rem; }
.right-4 { right: 1rem; }
.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.gap-1 { gap: 0.25rem; }

.controls-overlay {
  z-index: 10;
  pointer-events: none;
  padding: 0 0.5rem;
}

.additional-controls,
.zoom-controls {
  pointer-events: auto;
}

.additional-controls {
  flex-grow: 1;
  overflow: hidden;
}

.additional-controls :deep(.zone-selector) {
  margin-top: 0;
}

.additional-controls :deep(.p-selectbutton .p-button) {
  padding: 0.3rem 0.6rem;
  font-size: 0.75rem;
  min-width: auto;
}

.zoom-controls button {
  padding: 0.4rem 0.6rem;
  min-width: auto;
  line-height: 1;
}
</style>