<template>
  <div class="force-graph-component relative" ref="container" :style="containerStyle">
    <!-- D3 SVG will be appended here -->
    
    <!-- Controls container -->
    <div class="controls-overlay absolute bottom-4 justify-between items-center">
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
import { ref, onMounted, watch, computed, onBeforeUnmount, nextTick } from 'vue';
import * as d3 from 'd3';
import 'd3-transition'; // Ensure transition support is available
import { useZoom, type ViewportState } from '~/composables/useZoom';
import { useNodeStyling } from '~/composables/useNodeStyling';
import { useLinkStyling } from '~/composables/useLinkStyling';
import { useForceSimulation } from '~/composables/useForceSimulation';
import type { GraphNode, GraphLink } from '~/types/graph';

const props = defineProps<{
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
}>();

const emit = defineEmits(['nodeClick', 'nodePositionsUpdated', 'nodeTextUpdated']);
const container = ref<HTMLElement | null>(null);
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let linkGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
let nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

// Add this ref to track reset state
const isResetting = ref(false);

// Compute responsive container style
const containerStyle = computed(() => {
  return {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
  };
});

// Use our composables
const { 
  initializeZoom, 
  zoomIn: zoomInFn, 
  zoomOut: zoomOutFn, 
  resetZoom: resetZoomFn, 
  centerOnNode: centerOnNodeFn,
  getCurrentViewport: getCurrentViewportFn,
  applyViewport: applyViewportFn,
} = useZoom();

const { applyNodeStyle, getSubjectImagePath, createNodeGradients } = useNodeStyling();
const { createLinkGradient, createUniqueGradient, updateGradientPositions, applyLinkStyle } = useLinkStyling();
const { createSimulation, updateSimulation, createDragBehavior } = useForceSimulation();

onMounted(() => {
  initializeGraph();
  
  // Add resize event listener
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  saveNodePositions();
  
  // Remove resize event listener
  window.removeEventListener('resize', handleResize);
});

// Debounced resize handler
let resizeTimeout: number | null = null;
function handleResize() {
  if (resizeTimeout) {
    window.clearTimeout(resizeTimeout);
  }
  
  resizeTimeout = window.setTimeout(() => {
    updateGraph();
  }, 250);
}

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

  const containerRect = container.value.getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height;

  // Determine if loading saved positions
  const hasSavedPositions = props.nodes.some(n => n.x !== undefined && n.y !== undefined);

  // Initialize node positions
  props.nodes.forEach(node => {
    if (!hasSavedPositions) {
      // New graph: center nodes
      node.x = width / 2;
      node.y = height / 2;
      // Fix parent nodes at center initially
      if (!node.parentId) {
        node.fx = width / 2;
        node.fy = height / 2;
      } else {
        node.fx = null;
        node.fy = null;
      }
    } else {
      // Respect saved positions: reset any fixed positions
      node.fx = null;
      node.fy = null;
    }
    // Reset velocities
    node.vx = 0;
    node.vy = 0;
  });

  svg = d3.select(container.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg.append('g').attr('class', 'zoom-group');
  linkGroup = g.append('g').attr('class', 'links');
  nodeGroup = g.append('g').attr('class', 'nodes');

  if (svg) {
    if (svg.select('defs').empty()) svg.append('defs');
    createNodeGradients(svg);
    createLinkGradient(svg);
  }

  initializeZoom(svg, g, width, height, 1.4);

  applyViewportFn(svg, undefined, 0);

  simulation = createSimulation(props.nodes, props.links, width, height);

  if (simulation) {
    simulation.on('tick', () => {
      if (!svg || !nodeGroup || !linkGroup) return;

      nodeGroup.selectAll<SVGGElement, GraphNode>('g')
        .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);

      linkGroup.selectAll<SVGLineElement, GraphLink>('line')
        .attr('x1', d => (d.source as GraphNode).x || 0)
        .attr('y1', d => (d.source as GraphNode).y || 0)
        .attr('x2', d => (d.target as GraphNode).x || 0)
        .attr('y2', d => (d.target as GraphNode).y || 0);

      const svgEl = svg;
      if (svgEl) {
        linkGroup.selectAll<SVGLineElement, GraphLink>('line').each(function(d) {
          const source = d.source as GraphNode;
          const target = d.target as GraphNode;
          
          updateGradientPositions(svgEl, source, target);
        });
      }
    });
    
    updateVisualElements();

    // Kickstart simulation for new graphs; skip if loading saved positions
    if (!hasSavedPositions) {
      simulation.tick(30);
      simulation.alpha(0.3).restart();
      // Release fixed positions after initial spread
      setTimeout(() => {
        if (simulation) {
          simulation.nodes().forEach(node => {
            if (!node.parentId) {
              node.fx = null;
              node.fy = null;
            }
          });
        }
      }, 150);
    }

  } else {
    console.error("Failed to initialize D3 simulation.");
  }
}

function updateGraph() {
  if (!svg || !simulation || !container.value) return;
  
  const containerRect = container.value.getBoundingClientRect();
  const width = containerRect.width;
  const height = containerRect.height;
  
  svg.attr('viewBox', `0 0 ${width} ${height}`);
  
  simulation = updateSimulation(simulation, props.nodes, props.links, width, height);

  updateLinks();
  updateNodes();

  const selectedParent = props.nodes.find(n => n.selected && !n.parentId);
  setTimeout(() => {
    if (selectedParent) {
      selectedParent.fx = null;
      selectedParent.fy = null;
    }
  }, 300);
}

function updateLinks() {
  if (!linkGroup || !svg) return;

  const link = linkGroup.selectAll<SVGLineElement, GraphLink>('line')
    .data(props.links, d => {
      const sourceId = typeof d.source === 'object' ? (d.source as GraphNode).id : d.source;
      const targetId = typeof d.target === 'object' ? (d.target as GraphNode).id : d.target;
      return `${sourceId}-${targetId}`;
    });

  const linkEnter = link.enter()
    .append('line')
    .attr('stroke', 'url(#link-gradient)');
    
  applyLinkStyle(linkEnter.merge(link));

  const svgEl = svg;
  if (svgEl) {
    linkGroup.selectAll<SVGLineElement, GraphLink>('line').each(function(d) {
      const line = d3.select(this);
      const source = d.source as GraphNode;
      const target = d.target as GraphNode;
      
      const gradientId = createUniqueGradient(svgEl, source, target);
      line.attr('stroke', `url(#${gradientId})`);
    });
  }

  link.exit().remove();
}

function updateNodes() {
  if (!nodeGroup || !simulation || !svg) return;

  createNodeGradients(svg);

  const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
    .data(props.nodes, d => d.id);

  const nodeEnter = node.enter()
    .append('g')
    .attr('class', 'node')
    .call(createDragBehavior(simulation))
    .on('click', (event: MouseEvent, d: GraphNode) => {
      const targetEl = event.target as Element;
      if (targetEl.tagName.toLowerCase() === 'input') {
        return;
      }

      console.log('Node clicked:', d.id);
      emit('nodeClick', d.id);
      updateNodeSelection(d.id);
      if (svg) {
        centerOnNodeFn(svg, d);
      }
    })
  

  nodeEnter.append('circle')
    .attr('r', d => d.size / 2)
    .attr('class', 'node-circle');
  
  nodeEnter.filter(d => d.zone === 'Subject' && !d.parentId)
    .append('image')
    .attr('xlink:href', d => getSubjectImagePath(d.text))
    .attr('x', d => -d.size / 2)
    .attr('y', d => -d.size / 2)
    .attr('width', d => d.size)
    .attr('height', d => d.size)
    .attr('class', 'subject-node-image')
    .on('error', function() {
      d3.select(this).style('display', 'none');
    });

  node.exit().remove();

  nodeGroup.selectAll<SVGGElement, GraphNode>('g')
    .each(function(d) {
      applyNodeStyle(d3.select(this), false, svg, updateTextForNode);
    });
}

function updateNodeSelection(id: string) {
  if (!nodeGroup || !svg) return;

  nodeGroup.selectAll<SVGGElement, GraphNode>('g')
    .each(function(d) {
      applyNodeStyle(d3.select(this), false, svg, updateTextForNode);
    });

  const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g')
    .filter(d => d.id === id);
    
  setTimeout(() => {
    applyNodeStyle(node, true, svg, updateTextForNode);
    node.select('.node-circle')
      .transition()
      .duration(300)
      .attr('r', d => d.size / 2 * 1.05)
      .transition()
      .duration(300)
      .attr('r', d => d.size / 2);
    node.raise();
  }, 50);
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

function updateTextForNode(nodeId: string, newText: string) {
  console.log('[ForceGraph] Emitting nodeTextUpdated:', { id: nodeId, text: newText });
  emit('nodeTextUpdated', { id: nodeId, text: newText });
}

function updateVisualElements() {
  updateLinks();
  updateNodes();
}

// Expose methods for parent component interaction
interface ForceGraphExposed {
  getCurrentViewport: () => ViewportState | null;
  applyViewport: (state?: ViewportState, duration?: number) => void;
  centerOnNode: (node: { x?: number | null; y?: number | null }) => void;
  resetAndCenter: () => void;
}

defineExpose<ForceGraphExposed>({
  getCurrentViewport: () => getCurrentViewportFn(svg),
  applyViewport: (state?: ViewportState, duration?: number) => {
    applyViewportFn(svg, state, duration);
  },
  centerOnNode: (node: { x?: number | null; y?: number | null }) => {
    if (svg) centerOnNodeFn(svg, node);
  },
  resetAndCenter: () => {
    console.log("ForceGraph hard reset and center called");
    if (!svg || !simulation) return;
    
    // Prevent multiple reset calls in quick succession
    if (isResetting.value) {
      console.log("Reset already in progress, skipping");
      return;
    }
    
    isResetting.value = true;
    
    // Force stop any current simulation
    simulation.stop();
    
    // Get container dimensions
    const containerRect = container.value?.getBoundingClientRect();
    const width = containerRect?.width || props.width;
    const height = containerRect?.height || props.height;
    
    // Ensure SVG viewBox is correctly set for the container size
    if (svg && width && height) {
      svg.attr('viewBox', `0 0 ${width} ${height}`)
         .attr('width', '100%')
         .attr('height', '100%')
         .attr('preserveAspectRatio', 'xMidYMid meet');
    }
    
    // Reset all nodes to center to create the "expand from center" effect
    const centerX = width / 2;
    const centerY = height / 2;
    
    if (props.nodes.length > 0) {
      props.nodes.forEach(node => {
        node.x = centerX + (Math.random() - 0.5) * 10;
        node.y = centerY + (Math.random() - 0.5) * 10;
        node.vx = 0;
        node.vy = 0;
      });
    }
    
    // Hard reset zoom to default centered view
    applyViewportFn(svg, undefined, 0);
    
    // Update the simulation with current nodes and links
    updateSimulation(simulation, props.nodes, props.links, width, height);
    
    // Kickstart simulation to allow nodes to spread
    simulation.alpha(1).restart();
    
    // Clear reset flag after short delay
    setTimeout(() => {
      isResetting.value = false;
    }, 500);
  }
});
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
  transition: all 0.2s ease;
  
  &:hover circle.node-circle {
    stroke: rgba(255, 255, 255, 0.8);
    fill: rgba(255, 255, 255, 0.3);
    filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.4));
  }
  
  .node-circle {
    transition: all 0.3s ease;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
  
  .subject-node-image {
    clip-path: circle(50%);
    object-fit: cover;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
  }
  
  .node-text {
    font-weight: 500;
    text-shadow: 0 0 4px rgba(255, 255, 255, 0.9);
    pointer-events: auto;
    cursor: text;
    transition: all 0.2s ease;
  }
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
  width: 100%;
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
  margin-bottom: 0.5rem;
  width: 100%;
  display: flex;
  justify-content: center;
  
  .p-selectbutton {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 100%;
    
    .p-button {
      margin: 2px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.4rem 0.8rem;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
      }
    }
  }
}

.additional-controls :deep(.p-togglebutton) {
  font-size: 0.90rem !important;
  min-width: auto;
}

.zoom-controls button {
  padding: 0.4rem 0.6rem;
  min-width: auto;
  line-height: 1;
}
</style>