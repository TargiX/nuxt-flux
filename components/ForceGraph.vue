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
    <NodeContextMenu ref="contextMenu" :node-id="contextMenuNodeId" @menu-action="handleContextMenuAction" />
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
import NodeContextMenu from './NodeContextMenu.vue';

const props = defineProps<{
  width: number;
  height: number;
  nodes: GraphNode[];
  links: GraphLink[];
}>();

const emit = defineEmits(['nodeClick', 'nodePositionsUpdated', 'nodeTextUpdated', 'menuAction']);
const container = ref<HTMLElement | null>(null);
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let linkGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
let nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
let simulation: d3.Simulation<GraphNode, GraphLink> | null = null;

// Add this ref to track reset state
const isResetting = ref(false);

const contextMenu = ref<InstanceType<typeof NodeContextMenu> | null>(null);
const contextMenuNodeId = ref<string | null>(null);

// Add this after the existing refs at the top of the script
let currentHoveredNodeId: string | null = null;
let hoverThrottleTimeout: number | null = null;

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
  hardReset: hardResetFn,
  centerOnNode: centerOnNodeFn,
  getCurrentViewport: getCurrentViewportFn,
  applyViewport: applyViewportFn,
} = useZoom();

const { 
  applyNodeStyle, 
  getSubjectImagePath, 
  createNodeGradients, 
  startTextEdit, 
  formatNodeText
} = useNodeStyling();
const { createLinkGradient, createUniqueGradient, updateGradientPositions, applyLinkStyle } = useLinkStyling();
const { createSimulation, updateSimulation, createDragBehavior } = useForceSimulation();

// Add version stamp for optimized watching
const graphVersion = ref(0);
let resizeObserver: ResizeObserver | null = null;

// Batched structural watch to throttle multiple triggers into one per update cycle
let pendingUpdate = false;
watch(
  () => [props.nodes.length, props.links.length],
  () => {
    if (!pendingUpdate) {
      pendingUpdate = true;
      setTimeout(() => {
        console.log('Graph structure LENGTH (batched), triggering update');
        graphVersion.value++;
        pendingUpdate = false;
      }, 10);
    }
  }
);

// Optimized watch - replace deep JSON.stringify with version stamp
watch(
  () => graphVersion.value,
  () => {
    console.log('Graph updating due to version change');
    updateGraph();
  }
);

// Watch for structural changes and increment version
watch(
  () => props.nodes.map(node => ({ id: node.id, text: node.text, selected: node.selected, isLoading: node.isLoading })),
  (newValues, oldValues) => {
    // Check if there are actual content changes
    if (oldValues && newValues.length === oldValues.length) {
      const hasChanges = newValues.some((newNode, index) => {
        const oldNode = oldValues[index];
        return oldNode && (
          newNode.text !== oldNode.text ||
          newNode.selected !== oldNode.selected ||
          newNode.isLoading !== oldNode.isLoading
        );
      });
      
      if (hasChanges) {
        console.log('Graph content changed, triggering update');
        console.log('Changed nodes:', newValues.filter((newNode, index) => {
          const oldNode = oldValues[index];
          return oldNode && (
            newNode.text !== oldNode.text ||
            newNode.selected !== oldNode.selected ||
            newNode.isLoading !== oldNode.isLoading
          );
        }));
        graphVersion.value++;
      }
    } else {
      // Length changed or first run
      console.log('Graph structure changed (length or first run)');
      graphVersion.value++;
    }
  },
  { deep: true }
);

onMounted(() => {
  initializeGraph();
  
  // Use ResizeObserver instead of window resize for better performance
  if (container.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use requestAnimationFrame for batching
        requestAnimationFrame(() => {
          updateGraph();
        });
      }
    });
    resizeObserver.observe(container.value);
  }
});

onBeforeUnmount(() => {
  saveNodePositions();

  currentHoveredNodeId = null;
  if (hoverThrottleTimeout) {
    clearTimeout(hoverThrottleTimeout);
    hoverThrottleTimeout = null;
  }
  
  // Cleanup simulation and SVG to prevent memory leaks
  if (simulation) {
    simulation.stop();
    simulation = null;
  }
  
  if (svg) {
    svg.on('mouseleave', null);
    svg.selectAll('*').remove();
    svg = null;
  }
  
  // Cleanup ResizeObserver
  if (resizeObserver && container.value) {
    resizeObserver.unobserve(container.value);
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

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
    // Throttle DOM updates for better performance while keeping physics smooth
    let needsRender = false;
    
    simulation.on('tick', () => {
      needsRender = true;
    });
    
    // Render loop - updates DOM at 60fps regardless of simulation frequency
    const renderLoop = () => {
      if (needsRender && svg && nodeGroup && linkGroup) {
        nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
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
        
        needsRender = false;
      }
      requestAnimationFrame(renderLoop);
    };
    
    // Start the render loop
    requestAnimationFrame(renderLoop);
    
    updateVisualElements();

    // Kickstart simulation for new graphs; skip if loading saved positions
    if (!hasSavedPositions) {
      // Remove manual ticking - let natural forces handle positioning
      simulation.alpha(0.15).restart(); // Reduced for faster stabilization
      // Release fixed positions after initial spread - much faster
      setTimeout(() => {
        if (simulation) {
          simulation.nodes().forEach(node => {
            if (!node.parentId) {
              node.fx = null;
              node.fy = null;
            }
          });
        }
      }, 50); // Reduced from 150ms to 50ms for faster release
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

  const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
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
        // Temporarily pin the node to prevent force drift during centering
        d.fx = d.x;
        d.fy = d.y;
        
        // Snappy centering using predictive translation
        centerOnNodeFn(svg, d);
        
        // Release the pin after centering completes
        setTimeout(() => {
          d.fx = null;
          d.fy = null;
        }, 750); // Match the centering duration
      }
      // Hide context menu on left click
      if (contextMenu.value) {
        contextMenu.value.hide();
      }
    })
    .on('contextmenu', (event: MouseEvent, d: GraphNode) => {
      event.preventDefault(); // Prevent browser default context menu
      contextMenuNodeId.value = d.id;
      if (contextMenu.value) {
        contextMenu.value.show(event);
      }
      console.log('Node right-clicked:', d.id);
    });
  

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

  // Append text elements only on enter
  nodeEnter.each(function(d) {
    const nodeGroup = d3.select(this);
    const textLines = formatNodeText(d.text);
    const textElements: d3.Selection<SVGTextElement, unknown, any, any>[] = [];
    textLines.forEach((line, i) => {
      const yPos = d.size / 2 + 8 + (i * 14);
      const textElement = nodeGroup.append('text')
        .attr('class', 'node-text')
        .attr('x', 0)
        .attr('y', yPos)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'hanging')
        // Initial styles, applyNodeStyle will adjust them later if needed
        .attr('font-size', '10px') 
        .attr('fill', 'rgba(255, 255, 255, 0.8)')
        .attr('font-weight', '500')
        .attr('text-shadow', '0 0 4px rgba(255, 255, 255, 0.7)')
        .style('cursor', d.isLoading ? 'default' : 'text')
        .style('pointer-events', d.isLoading ? 'none' : 'auto')
        .style('user-select', 'none')
        .style('paint-order', 'stroke fill')
        .style('stroke', 'transparent')
        .style('stroke-width', '6px')
        .text(line)
        .attr('data-node-id', d.id);
      textElements.push(textElement);

      if (!d.isLoading) {
        textElement.on('click.textEdit', function(event) {
          event.stopPropagation();
          // Pass the array of d3 selections of text elements for this node
          startTextEdit(event, d, nodeGroup.node() as SVGGElement, textElements, updateTextForNode);
        });
      }
    });
  });

  node.exit().remove();
  
  const nodeMerge = nodeEnter.merge(node as any);
  
  // Apply visual styles and handle hover effects
  nodeMerge.each(function(d) {
    // Apply base styles (no hover)
    applyNodeStyle(d3.select(this), false, svg);
    
    // Update text content if it changed
    const textLines = formatNodeText(d.text);
    const currentTextGroup = d3.select(this);
    const textElementsSelection = currentTextGroup.selectAll<SVGTextElement, string>('.node-text').data(textLines);
    
    // Update existing text elements
    textElementsSelection.text(line => line);
    
    // Add new text elements if the number of lines increased
    textElementsSelection.enter().append('text')
      .attr('class', 'node-text')
      .attr('x', 0)
      .attr('y', (line, i, nodes) => {
        // Calculate y position based on existing elements or default if none
        const existingTextElements = currentTextGroup.selectAll('.node-text');
        const baseIndex = existingTextElements.size() > nodes.length 
                          ? existingTextElements.size() - nodes.length + i 
                          : i;
        return d.size / 2 + 8 + (baseIndex * 14);
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'hanging')
      .attr('font-size', d.selected ? '11px' : '10px') // Match applyNodeStyle logic or initial setup
      .attr('fill', 'rgba(255, 255, 255, 0.8)') // Match initial setup
      .attr('font-weight', d.selected ? '700' : '500') // Match applyNodeStyle logic or initial setup
      .attr('text-shadow', d.selected ? '0 0 6px rgba(255, 255, 255, 0.9)' : '0 0 4px rgba(255, 255, 255, 0.7)') // Match applyNodeStyle logic or initial setup
      .style('cursor', d.isLoading ? 'default' : 'text')
      .style('pointer-events', d.isLoading ? 'none' : 'auto')
      .style('user-select', 'none')
      .style('paint-order', 'stroke fill')
      .style('stroke', 'transparent')
      .style('stroke-width', '6px')
      .attr('data-node-id', d.id)
      .text(line => line)
      .each(function(lineData) { // `this` refers to the newly created text element
        const textElement = d3.select(this);
        if (!d.isLoading) {
          textElement.on('click.textEdit', function(event) {
            event.stopPropagation();
            // Need to collect all text elements for this node again for startTextEdit
            const allTextElementsForNode = currentTextGroup.selectAll<SVGTextElement, unknown>('.node-text').nodes()
              .map(el => d3.select(el)); 
            startTextEdit(event, d, currentTextGroup.node() as SVGGElement, allTextElementsForNode, updateTextForNode);
          });
        }
      });
      
    // Remove text elements if the number of lines decreased
    textElementsSelection.exit().remove();
  })
  .on('mouseenter', function(event: MouseEvent, d: GraphNode) {
    // Only trigger hover styling when entering the group itself, not its children
    if (event.target !== this) return;
    if (hoverThrottleTimeout) clearTimeout(hoverThrottleTimeout);
    hoverThrottleTimeout = window.setTimeout(() => {
      clearAllHoverStates();
      if (!d.selected && !d.isLoading) {
        currentHoveredNodeId = d.id;
        applyNodeStyle(d3.select(this), true, svg);
      }
      hoverThrottleTimeout = null;
    }, 50);
  })
  .on('mouseleave', function(event: MouseEvent, d: GraphNode) {
    // Only trigger hover cleanup when leaving the group itself, not its children
    if (event.target !== this) return;
    if (hoverThrottleTimeout) { clearTimeout(hoverThrottleTimeout); hoverThrottleTimeout = null; }
    if (currentHoveredNodeId === d.id && !d.selected && !d.isLoading) {
      currentHoveredNodeId = null;
      applyNodeStyle(d3.select(this), false, svg);
    }
  })
  

  // Add a global mouseleave handler to the SVG to catch edge cases
  if (svg) {
    svg.on('mouseleave', () => {
      // Clear all hover states when mouse leaves the entire SVG
      clearAllHoverStates();
    });
  }
}

// Helper function to clear all hover states
function clearAllHoverStates() {
  if (!nodeGroup || !svg) return;
  
  // Clear any pending hover timeout
  if (hoverThrottleTimeout) {
    clearTimeout(hoverThrottleTimeout);
    hoverThrottleTimeout = null;
  }
  
  // Reset the tracked hovered node
  const previousHoveredId = currentHoveredNodeId;
  currentHoveredNodeId = null;
  
  // Clear hover styling from all unselected, non-loading nodes
  nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
    .each(function(d) {
      applyNodeStyle(d3.select(this), false, svg);
    });
}

function updateNodeSelection(id: string) {
  if (!nodeGroup || !svg) return;

  nodeGroup.selectAll<SVGGElement, GraphNode>('g')
    .each(function(d) {
      applyNodeStyle(d3.select(this), false, svg);
    });

  const node = nodeGroup.selectAll<SVGGElement, GraphNode>('g.node')
    .filter(d => d.id === id);
    
  setTimeout(() => {
    applyNodeStyle(node, true, svg);
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

function handleContextMenuAction(payload: { action: string; nodeId: string }) {
  console.log(`Context menu action '${payload.action}' on node '${payload.nodeId}'`);
  // Handle specific actions here if needed, or emit further up
  if (contextMenu.value) {
    contextMenu.value.hide();
  }
}

// Expose methods for parent component interaction
interface ForceGraphExposed {
  getCurrentViewport: () => ViewportState | null;
  applyViewport: (state?: ViewportState, duration?: number) => void;
  centerOnNode: (node: { x?: number | null; y?: number | null }) => void;
  resetAndCenter: () => void;
  triggerUpdate: () => void; // Add method to manually trigger updates
  centerAndPinNodeById: (id: string) => void;
}

defineExpose<ForceGraphExposed>({
  getCurrentViewport: () => getCurrentViewportFn(svg),
  applyViewport: (state?: ViewportState, duration?: number) => {
    // If state is undefined, always apply the default viewport with initial zoom scale
    if (!state) {
      console.log("ForceGraph applying default viewport with initial zoom scale");
    } else {
      console.log(`ForceGraph applying viewport: custom (${state.x.toFixed(2)},${state.y.toFixed(2)},${state.k.toFixed(2)})`);
    }
    
    // Apply the viewport with the specified duration (or default)
    applyViewportFn(svg, state, duration !== undefined ? duration : 750);
  },
  centerOnNode: (node: { x?: number | null; y?: number | null }) => {
    if (svg) centerOnNodeFn(svg, node);
  },
  resetAndCenter: () => {
    console.log("ForceGraph resetAndCenter called - performing full reset");
    if (!svg || !simulation || !container.value) return;
    
    // Get container dimensions
    const containerRect = container.value.getBoundingClientRect();
    const width = containerRect?.width || props.width;
    const height = containerRect?.height || props.height;
    
    // Ensure SVG viewBox is correctly set for the container size
    if (svg && width && height) {
      svg.attr('viewBox', `0 0 ${width} ${height}`)
         .attr('width', '100%')
         .attr('height', '100%')
         .attr('preserveAspectRatio', 'xMidYMid meet');
    }
    
    // Reset all nodes to center
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Force all nodes to center 
    props.nodes.forEach(node => {
      // Remove and reset positions
      delete node.x;
      delete node.y;
      delete node.vx;
      delete node.vy;
      
      node.x = centerX;
      node.y = centerY;
      node.vx = 0;
      node.vy = 0;
    });
    
    // Apply default viewport (force initialZoomScale use)
    applyViewportFn(svg, undefined, 0);
    
    // Update simulation and let natural decay handle stabilization
    updateSimulation(simulation, props.nodes, props.links, width, height);
    
    // Restart simulation at high energy - let forces naturally stabilize
    simulation.alpha(1).restart();
  },
  triggerUpdate: () => {
    // Manual method to trigger graph updates when needed
    graphVersion.value++;
  },
  centerAndPinNodeById: (id: string) => {
    if (!svg || !simulation) return;
    // Find the node in the simulation by id
    const node = simulation.nodes().find(n => (n as GraphNode).id === id) as GraphNode | undefined;
    if (!node) return;
    // Pin the node at its current position
    node.fx = node.x;
    node.fy = node.y;
    // Center the view on the node
    centerOnNodeFn(svg, node);
    // Release the node pin after centering completes
    setTimeout(() => {
      node.fx = null;
      node.fy = null;
    }, 750);
    
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

  .node-circle {
    transition: all 0.2s ease;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
    transform-origin: center;
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