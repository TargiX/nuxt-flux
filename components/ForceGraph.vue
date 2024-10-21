<template>
  <div ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import * as d3 from 'd3';
import { useTagStore } from '~/store/tagStore';

const props = defineProps<{
  width: number;
  height: number;
  zone: string;
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
  addZoomBehavior();
  preventCollapseOnEmptyClick();
}

function updateGraph() {
  if (!zoneGraph.value.simulation || !zoneGraph.value.svg) return;

  zoneGraph.value.simulation.stop();
  updateNodesAndLinks();
  zoneGraph.value.simulation.tick(10);
  updateNodeAndLinkPositions();
  updateNodeColors();
  zoneGraph.value.simulation.alpha(0.3).restart();
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

  const oldNodes = new Map(zoneGraph.value.nodes.map(d => [d.id, d]));
 
  const nodes = [...zoneTags, ...secondaryTags].map(tag => {
    const oldNode = oldNodes.get(tag.id);
    let x, y;
    if (tag.id === tagStore.lastClickedTagId && tagStore.lastClickedNode) {
      x = tagStore.lastClickedNode.x;
      y = tagStore.lastClickedNode.y;
    } else {
      x = oldNode?.x ?? props.width / 2;
      y = oldNode?.y ?? props.height / 2;
    }
    const vx = oldNode?.vx ?? 0;
    const vy = oldNode?.vy ?? 0;

    return {
      ...tag,
      r: tag.size / 2,
      x,
      y,
      vx,
      vy,
    };
  });

  const links = tagStore.createLinksBySourceId(props.zone, tagStore.lastClickedTagId);

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
  event.stopPropagation();
  
  if (d.zone.includes('-secondary')) {
    emit('secondaryTagSelected', d.id);
  } else {
    d.selected = !d.selected;

    if (d.selected) {
      tagStore.unselectAllSecondaryTagsFromZone(props.zone, d.alias);
      // Store the current position of the clicked node
      tagStore.setLastClickedTag(d.id, d.x, d.y);
    } else {
      tagStore.setLastClickedTag(null);
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

  zoneGraph.value.links = tagStore.createLinksBySourceId(props.zone, tagStore.lastClickedTagId);

  zoneGraph.value.simulation = d3.forceSimulation(zoneGraph.value.nodes)
    .force("link", d3.forceLink(zoneGraph.value.links).id(d => d.id).distance(50))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => d.r + 5))
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1));

  zoneGraph.value.svg = d3.select(chartContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Add a background rect to catch mouse events
  zoneGraph.value.svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  const g = zoneGraph.value.svg.append("g");

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
  const isSelected = d.id === tagStore.lastClickedTagId;
  const newSize = isSelected ? baseSize * 1.2 : baseSize;
  
  // Update only the specific node
  node.select("circle")
    .attr("fill", isSelected ? "#4CAF50" : color(d.zone))
    .attr("r", newSize / 2);
  
  node.select("text")
    .attr("y", newSize / 2 + 10);

  // Update the node data in the simulation
  const index = zoneGraph.value.nodes.findIndex(n => n.id === d.id);
  if (index !== -1) {
    zoneGraph.value.nodes[index] = { ...zoneGraph.value.nodes[index], ...d, size: newSize, selected: isSelected };
    zoneGraph.value.simulation.nodes(zoneGraph.value.nodes);
  }

  // Gently reheat the simulation for smooth transitions
  zoneGraph.value.simulation.alpha(0.1).restart();
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

<style >
.selected {
  fill: #4CAF50;
}

.links line {
  stroke: #999;
  stroke-opacity: 0.6;
  stroke-width: 1.5px;
}
</style>
