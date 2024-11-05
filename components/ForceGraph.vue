<template>
  <div ref="chartContainer" :style="{ width: `${width}px`, height: `${height}px` }"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import * as d3 from 'd3';
import { useTagStore } from '~/store/tagStore';
import { ArrowPathIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  width: number;
  height: number;
  zone: string;
  preview?: boolean;
  zoomConfig?: {
    scale: number;
    translateX: number;
    translateY: number;
  };
}>();

const emit = defineEmits(['tagSelected', 'secondaryTagSelected']);

const chartContainer = ref<HTMLElement | null>(null);
const tagStore = useTagStore();

const zoneGraph = computed(() => tagStore.getZoneGraph(props.zone));

onMounted(() => {
  createForceGraph(); 
});

watch(() => tagStore.tagsByZone(props.zone), updateGraph, { deep: true });

function createForceGraph() {
  if (!chartContainer.value) return;

  const { width, height } = props;
  
  setupSvgAndSimulation(width, height);
  updateNodesAndLinks();
  if (!props.preview) {
    addZoomBehavior();
    preventCollapseOnEmptyClick();
  }
}

function updateGraph() {
  if (!zoneGraph.value.simulation || !zoneGraph.value.svg) return;

  zoneGraph.value.simulation.stop();
  
  // Store current positions
  const oldPositions = new Map(
    zoneGraph.value.nodes.map(d => [d.id, { x: d.x, y: d.y }])
  );
  
  updateNodesAndLinks();
  
  // Position new nodes near their parent with minimal initial velocity
  zoneGraph.value.nodes.forEach(node => {
    if (node.isDynamic && node.parentId) {
      const parent = zoneGraph.value.nodes.find(n => n.id === node.parentId);
      if (parent) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = 30; // Reduced from previous random distance
        node.x = parent.x + Math.cos(angle) * distance;
        node.y = parent.y + Math.sin(angle) * distance;
        node.vx = 0; // Start with zero velocity
        node.vy = 0;
      }
    } else {
      const oldPos = oldPositions.get(node.id);
      if (oldPos) {
        node.x = oldPos.x;
        node.y = oldPos.y;
      }
    }
  });

  // Restart simulation very gently
  zoneGraph.value.simulation
    .alpha(0.05) // Reduced from 0.1
    .alphaDecay(0.01) // Reduced from 0.02 for even smoother transitions
    .velocityDecay(0.4) // Added to reduce overall movement speed
    .restart();
}

function updateNodeAndLinkPositions() {
  zoneGraph.value.svg.selectAll(".nodes g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  zoneGraph.value.svg.selectAll(".links line")
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.y)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.y);
}

function updateNodesAndLinks() {
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  
  const zoneTags = tagStore.tagsByZone(props.zone);
  const secondaryTags = tagStore.getSecondaryTagsForZone(props.zone);
  const dynamicTags = tagStore.getDynamicTags(props.zone);

  const oldNodes = new Map(zoneGraph.value.nodes.map(d => [d.id, d]));
 
  const nodes = [...zoneTags, ...secondaryTags, ...dynamicTags].map(tag => {
    const oldNode = oldNodes.get(tag.id);
    let x, y;
    if (tag.id === zoneGraph.value.lastClickedTagId && zoneGraph.value.lastClickedNode) {
      x = zoneGraph.value.lastClickedNode.x;
      y = zoneGraph.value.lastClickedNode.y;
    } else {
      x = oldNode?.x ?? props.width / 2;
      y = oldNode?.y ?? props.height / 2;
    }
    const vx = oldNode?.vx ?? 0;
    const vy = oldNode?.vy ?? 0;

    return {
      ...tag,
      r: tag.size / 2,
      x: tag.isDynamic ? oldNode?.x + Math.random() * 50 : x,
      y: tag.isDynamic ? oldNode?.y + Math.random() * 50 : y,
      vx,
      vy,
    };
  });

  const links = tagStore.createLinksBySourceId(props.zone);

  tagStore.updateZoneGraph(props.zone, nodes, links);

  // Update simulation
  zoneGraph.value.simulation.nodes(nodes);
  zoneGraph.value.simulation.force("link", d3.forceLink(links).id(d => d.id).distance(50));

  // Update nodes
  const node = zoneGraph.value.svg.select(".nodes").selectAll("g")
    .data(zoneGraph.value.nodes, d => d.id);

  const nodeEnter = node.enter().append("g")
    .call(drag(zoneGraph.value.simulation))
    .on("click", handleNodeClick);

  // Add circle to entering nodes
  nodeEnter.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => d.selected ? "#4CAF50" : color(d.zone))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // Add text to entering nodes
  nodeEnter.append("text")
    .text(d => d.text)
    .attr("x", 0)
    .attr("y", d => d.r + 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px");

  // Add title to entering nodes
  nodeEnter.append("title")
    .text(d => d.id);

  // Update existing nodes
  node.merge(nodeEnter)
    .select("circle")
    .attr("r", d => d.r)
    .attr("fill", d => d.selected ? "#4CAF50" : color(d.zone));

  node.merge(nodeEnter)
    .select("text")
    .attr("y", d => d.r + 10);

  // Remove exiting nodes
  node.exit().remove();
  zoneGraph.value.node = node.merge(nodeEnter);
  zoneGraph.value.simulation.on("tick", () => {
    const links = zoneGraph.value.simulation.force("link").links();

    zoneGraph.value.link
      .data(links)
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    zoneGraph.value.node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  });
  // Update links
  updateLinks();

  // After updating nodes and links, call updateNodeColors
  updateNodeColors();
}

function handleNodeClick(event, d) {
  if (props.preview) return;
  
  event.stopPropagation();
  
  if (d.zone.includes('-secondary')) {
    emit('secondaryTagSelected', d.id);
  } else {
    d.selected = !d.selected;

    if (d.selected) {
      tagStore.unselectAllSecondaryTagsFromZone(props.zone, d.alias);
      // Store the current position of the clicked node
      tagStore.setLastClickedTag(props.zone, d.id, d.x, d.y);
    } else {
      tagStore.setLastClickedTag(props.zone, null);
    }
    
    updateGraph();
    emit('tagSelected', d.id, props.zone);
  }
  updateNodeAppearance(d);
}

function updateLinks() {
  const linkSelection = zoneGraph.value.svg.select(".links").selectAll("line")
    .data(zoneGraph.value.links, d => {
      const sourceId = typeof d.source === 'object' ? d.source.id : d.source;
      const targetId = typeof d.target === 'object' ? d.target.id : d.target;
      return `${sourceId}-${targetId}`;
    });

  linkSelection.exit().remove();

  const linkEnter = linkSelection.enter()
    .append("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  zoneGraph.value.link = linkEnter.merge(linkSelection);
}

function setupSvgAndSimulation(width, height) {
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Filter tags for the current zone
  const zoneTags = tagStore.tagsByZone(props.zone);
  const secondaryTags = tagStore.getSecondaryTagsForZone(props.zone);

  // Prepare nodes and links
  zoneGraph.value.nodes = [...zoneTags, ...secondaryTags].map(tag => ({
    ...tag,
    r: tag.size / 2,
  }));

  zoneGraph.value.links = tagStore.createLinksBySourceId(props.zone);

  const simulationForces = {
    link: d3.forceLink(zoneGraph.value.links)
      .id(d => d.id)
      .distance(100)
      .strength(0.1), // Keep light connections
    charge: d3.forceManyBody()
      .strength(-60)  // Keep light repulsion
      .distanceMax(150),
    center: d3.forceCenter(width / 2, height / 2)
      .strength(0.3), // Added stronger center force (default is ~0.1)
    collision: d3.forceCollide()
      .radius(d => d.r + 10)
      .strength(0.4),
    x: d3.forceX(width / 2).strength(0.08),  // Increased from 0.01 to help with centering
    y: d3.forceY(height / 2).strength(0.08)  // Increased from 0.01 to help with centering
  };

  if (props.preview) {
    // Adjust forces for preview mode
    simulationForces.charge = d3.forceManyBody().strength(-50);
    simulationForces.collision = d3.forceCollide().radius(d => d.r + 2);
  }

  // Update simulation with new forces
  zoneGraph.value.simulation = d3.forceSimulation(zoneGraph.value.nodes)
    .force("link", simulationForces.link)
    .force("charge", simulationForces.charge)
    .force("center", simulationForces.center)  // Make sure center force is applied
    .force("collision", simulationForces.collision)
    .force("x", simulationForces.x)
    .force("y", simulationForces.y)
    .alphaDecay(0.02);

  zoneGraph.value.svg = d3.select(chartContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "width: 100%; height: 100%;");

  // Add a background rect to catch mouse events
  zoneGraph.value.svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  const g = zoneGraph.value.svg.append("g");

  // Apply zoom configuration if provided
  if (props.zoomConfig) {
    g.attr("transform", `translate(${props.zoomConfig.translateX}, ${props.zoomConfig.translateY}) scale(${props.zoomConfig.scale})`);
  }

  const link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(zoneGraph.value.links)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  const node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(zoneGraph.value.nodes)
    .join("g")
    .call(drag(zoneGraph.value.simulation))
    .on("click", handleNodeClick);

  node.append("circle")
    .attr("r", d => d.r)
    .attr("fill", d => d.selected ? "#4CAF50" : color(d.zone))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  node.append("text")
    .text(d => d.text)
    .attr("x", 0)
    .attr("y", d => d.r + 10)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px");

  node.append("title")
    .text(d => d.id);

    zoneGraph.value.simulation.on("tick", () => {
    zoneGraph.value.link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    zoneGraph.value.node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  });
}

function addZoomBehavior() {
  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on("zoom", (event) => {
      zoneGraph.value.svg.select("g").attr("transform", event.transform);
    });

  zoneGraph.value.svg.call(zoom);
}

function preventCollapseOnEmptyClick() {
  // Prevent collapsing when clicking on empty space
  zoneGraph.value.svg.on("click", (event) => {
    if (event.target.tagName === "svg" || event.target.tagName === "rect") {
      event.stopPropagation();
    }
  });
}

function updateNodeAppearance(d) {
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const node = zoneGraph.value.svg.select(`.nodes g`).filter(n => n.id === d.id);
  
  const baseSize = d.zone.includes('-secondary') ? 30 : 40;
  const isSelected = d.id === zoneGraph.value.lastClickedTagId;
  const newSize = isSelected ? baseSize * 1.2 : baseSize;
  
  // Update circle with loading animation if needed
  const circle = node.select("circle");
  if (d.isLoading) {
    let colorIndex = 0;
    // Create loading animation
    const loadingAnimation = () => {
      circle
        .transition()
        .duration(300)
        .attr("fill", loadingColors[colorIndex])
        .on("end", () => {
          colorIndex = (colorIndex + 1) % loadingColors.length;
          if (d.isLoading) {
            loadingAnimation();
          } else {
            circle.attr("fill", isSelected ? "#4CAF50" : color(d.zone));
          }
        });
    };
    loadingAnimation();
  } else {
    circle
      .attr("fill", isSelected ? "#4CAF50" : color(d.zone));
  }
  
  circle.attr("r", newSize / 2);
  
  node.select("text")
    .attr("y", newSize / 2 + 10);

  // Update the node data in the simulation
  const index = zoneGraph.value.nodes.findIndex(n => n.id === d.id);
  if (index !== -1) {
    zoneGraph.value.nodes[index] = { ...zoneGraph.value.nodes[index], ...d, size: newSize, selected: isSelected };
    zoneGraph.value.simulation.nodes(zoneGraph.value.nodes);
  }
}

function drag(simulation) {
  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }

  return d3.drag()
    .on("start", dragstarted)
    .on("drag", dragged)
    .on("end", dragended);
}

// Add this new function to update node colors
function updateNodeColors() {
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  zoneGraph.value.svg.selectAll(".nodes circle")
    .attr("fill", d => d.selected ? "#4CAF50" : color(d.zone));
}
</script>

<style scoped>
div {
  display: inline-block;
}
</style>
