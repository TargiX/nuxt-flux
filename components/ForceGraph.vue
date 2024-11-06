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

const loadingColors = ['#4CAF50', '#2196F3', '#4CAF50', '#2196F3', '#4CAF50']

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

  // Store current nodes before updating
  const oldNodesMap = new Map(
    zoneGraph.value.nodes.map(d => [d.id, { ...d }])
  );

  // Update nodes and links, passing oldNodesMap
  updateNodesAndLinks(oldNodesMap);

  // Adjust node positions based on old positions
  zoneGraph.value.nodes.forEach(node => {
    const oldNode = oldNodesMap.get(node.id);
    if (oldNode) {
      // Preserve old position and velocities
      node.x = oldNode.x;
      node.y = oldNode.y;
      node.vx = oldNode.vx;
      node.vy = oldNode.vy;
    } else if (node.isDynamic && node.parentId) {
      // Position new dynamic nodes near their parent
      const parent = zoneGraph.value.nodes.find(n => n.id === node.parentId);
      if (parent) {
        const angle = Math.random() * 2 * Math.PI;
        const distance = 100;
        node.x = parent.x + Math.cos(angle) * distance;
        node.y = parent.y + Math.sin(angle) * distance;
        node.vx = 0;
        node.vy = 0;
      } else {
        // Parent not found, position at center
        node.x = props.width / 2;
        node.y = props.height / 2;
        node.vx = 0;
        node.vy = 0;
      }
    } else {
      // Node without old position and not dynamic, keep current position or set to center
      node.x = node.x || props.width / 2;
      node.y = node.y || props.height / 2;
      node.vx = 0;
      node.vy = 0;
    }
  });

  // Restart simulation gently
  zoneGraph.value.simulation
    .alpha(0.1)
    .alphaDecay(0.05)
    .velocityDecay(0.6)
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

  // Find the currently selected tag to check its loading state
  const selectedTag = zoneTags.find(tag => tag.selected && tag.isLoading);
  
  // Filter out non-selected primary tags when there's a selected tag
  const visiblePrimaryTags = zoneTags.filter(tag => 
    !tag.zone.includes('-secondary') && (!selectedTag || tag.selected)
  );

  // Calculate positions for secondary nodes in a perfect circle
  const secondaryNodeCount = secondaryTags.length;
  const radius = 150; // Distance from parent
  const angleStep = (2 * Math.PI) / secondaryNodeCount;

  const nodes = [...visiblePrimaryTags, ...secondaryTags, ...dynamicTags].map((tag, index) => {
    const oldNode = oldNodes.get(tag.id);
    let x, y;

    if (oldNode) {
      x = oldNode.x;
      y = oldNode.y;
    } else if (tag.zone.includes('-secondary')) {
      // For secondary nodes, position them in a perfect circle around the parent
      const parent = visiblePrimaryTags[0];
      if (parent) {
        const parentX = parent.x || props.width / 2;
        const parentY = parent.y || props.height / 2;
        
        // Calculate position in perfect circle
        const secondaryIndex = secondaryTags.findIndex(t => t.id === tag.id);
        const angle = angleStep * secondaryIndex - Math.PI / 2; // Start from top (-Math.PI/2)
        
        x = parentX + Math.cos(angle) * radius;
        y = parentY + Math.sin(angle) * radius;
      } else {
        x = props.width / 2;
        y = props.height / 2;
      }
    } else {
      // Primary node should be centered
      x = props.width / 2;
      y = props.height / 2;
    }

    return {
      ...tag,
      r: tag.size / 2,
      x,
      y,
      vx: 0, // Reset velocity for smoother initialization
      vy: 0,
      isLoading: tag.isLoading,
    };
  });

  const links = tagStore.createLinksBySourceId(props.zone);

  tagStore.updateZoneGraph(props.zone, nodes, links);

  // Update simulation with separate forces for primary and secondary nodes
  zoneGraph.value.simulation.nodes(nodes);
  
  // Adjust force parameters
  zoneGraph.value.simulation
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(radius) // Match the radius we used for positioning
      .strength(0.5)) // Stronger links to maintain circle shape
    .force("charge", d3.forceManyBody()
      .strength(d => d.zone.includes('-secondary') ? -50 : -10)) // Weaker repulsion for primary
    .force("collision", d3.forceCollide()
      .radius(d => d.r + (d.zone.includes('-secondary') ? 30 : 10)) // More space between secondary nodes
      .strength(0.8))
    .force("centerPrimary", d3.forceRadial(0, props.width / 2, props.height / 2)
      .strength(d => d.zone.includes('-secondary') ? 0 : 1)) // Strong centering only for primary
    .force("circularSecondary", d3.forceRadial(radius, props.width / 2, props.height / 2)
      .strength(d => d.zone.includes('-secondary') ? 0.8 : 0)); // Keep secondary nodes in a circle

  // Adjust simulation parameters for smoother movement
  zoneGraph.value.simulation
    .alpha(0.3)
    .alphaDecay(0.02)
    .velocityDecay(0.4);

  // Important: Use the filtered nodes array here instead of zoneGraph.value.nodes
  const node = zoneGraph.value.svg.select(".nodes").selectAll("g")
    .data(nodes, d => d.id);

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

  // Update existing nodes and their classes
  const allNodes = node.merge(nodeEnter);

  // Update classes for all nodes
  allNodes.each(function(d) {
    const node = d3.select(this);
    if (d.isLoading) {
      node.classed("loading-node", true);
    } else {
      node.classed("loading-node", false);
    }
  });

  allNodes.select("circle")
    .attr("r", d => d.r)
    .attr("fill", d => {
      if (d.isLoading) return loadingColors[0];
      return d.selected ? "#4CAF50" : color(d.zone);
    });

  // If there's a loading node, start its animation
  if (selectedTag?.isLoading) {
    const loadingNode = allNodes.filter(d => d.id === selectedTag.id);
    updateNodeAppearance(selectedTag);
  }

  // Add title to entering nodes
  nodeEnter.append("title")
    .text(d => d.id);

  // Remove exiting nodes
  node.exit().remove();
  zoneGraph.value.node = node.merge(nodeEnter);

  // Update links
  updateLinks();

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

  // After updating nodes and links, update node colors
  updateNodeColors();
}


function handleNodeClick(event, d) {
  if (props.preview) return;
  
  event.stopPropagation();
  
  if (d.zone.includes('-secondary')) {
    // For secondary tags, just toggle selection and update appearance
    d.selected = !d.selected;
    updateNodeAppearance(d, false);
    emit('secondaryTagSelected', d.id);
    return; // Exit early for secondary tags
  }

  // Rest of the primary tag click handling...
  if (!d.selected) {
    d.isLoading = true;
    const node = zoneGraph.value.svg.selectAll(`.nodes g`).filter(n => n.id === d.id);
    node.classed("loading-node", true);
  }
  
  d.selected = !d.selected;

  if (d.selected) {
    tagStore.unselectAllSecondaryTagsFromZone(props.zone, d.alias);
    tagStore.setLastClickedTag(props.zone, d.id, d.x, d.y);
  } else {
    tagStore.setLastClickedTag(props.zone, null);
  }
  
  updateGraph();
  emit('tagSelected', d.id, props.zone);
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
      .strength(0.3),
    charge: d3.forceManyBody()
    .strength(-30) // Reduce repulsion
    .distanceMax(200),
    center: d3.forceCenter(width / 2, height / 2)
      .strength(0.3), // Added stronger center force (default is ~0.1)
    collision: d3.forceCollide()
      .radius(d => d.r + 10)
      .strength(0.4),
      x: d3.forceX(props.width / 2).strength(0.05),
      y: d3.forceY(props.height / 2).strength(0.05)
  };

  if (props.preview) {
    // Adjust forces for preview mode - bring nodes closer together
    simulationForces.link = d3.forceLink(zoneGraph.value.links)
      .id(d => d.id)
      .distance(20) // Reduced distance between linked nodes
      .strength(0.8); // Increased link strength to pull nodes together
    simulationForces.charge = d3.forceManyBody().strength(-20); // Reduced repulsion
    simulationForces.collision = d3.forceCollide().radius(d => d.r + 1); // Tighter collision radius
    simulationForces.center.strength(0.8); // Stronger center force to cluster nodes
    simulationForces.x.strength(0.2); // Stronger x force to center
    simulationForces.y.strength(0.2); // Stronger y force to center
  }

  // Update simulation with new forces
  zoneGraph.value.simulation = d3.forceSimulation(zoneGraph.value.nodes)
    .force("link", simulationForces.link)
    .force("charge", simulationForces.charge)
    .force("center", simulationForces.center)  // Make sure center force is applied
    .force("collision", simulationForces.collision)
    .force("x", simulationForces.x)
    .force("y", simulationForces.y)
    .alphaDecay(0.05)
  

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

function updateNodeAppearance(d, updateForces = true) {
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const nodes = zoneGraph.value.svg.selectAll(`.nodes g`).filter(n => n.id === d.id);

  const baseSize = d.zone.includes('-secondary') ? 30 : 40;

  nodes.each(function() {
    const node = d3.select(this);
    const circle = node.select("circle");

    // Only update the color, no size changes
    if (!d.isLoading) {
      circle.attr("fill", d.selected ? "#4CAF50" : color(d.zone));
    }
  });

  // Keep the node's radius constant
  const index = zoneGraph.value.nodes.findIndex(n => n.id === d.id);
  if (index !== -1) {
    zoneGraph.value.nodes[index].r = baseSize / 2;
    
    // Only update forces for primary nodes
    if (updateForces) {
      zoneGraph.value.simulation.force("collision", d3.forceCollide()
        .radius(n => n.r + 5)
        .strength(0.1));
      zoneGraph.value.simulation.alpha(0.1).restart();
    }
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

@keyframes loadingPulse {
  0% { fill: #4CAF50; }
  25% { fill: #2196F3; }
  50% { fill: #4CAF50; }
  75% { fill: #2196F3; }
  100% { fill: #4CAF50; }
}

/* Use ::v-deep to target elements inside the SVG */
::v-deep .loading-node circle {
  animation: loadingPulse 1s infinite;
}
</style>
