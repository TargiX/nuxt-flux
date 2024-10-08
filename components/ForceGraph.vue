<template>
  <div ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, reactive } from 'vue';
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

// Reactive state for the current zone's graphP
const zoneGraph = reactive({
  nodes: [],
  links: [],
  simulation: null as d3.Simulation<any, undefined> | null,
  svg: null as d3.Selection<SVGSVGElement, unknown, null, undefined> | null,
});

onMounted(() => {
  createForceGraph();
});

watch(() => tagStore.tagsByZone(props.zone), updateGraph, { deep: true });

function createForceGraph() {
  if (!chartContainer.value) return;

  const { width, height, zone } = props;
  
  // Setup SVG and simulation
  setupSvgAndSimulation(width, height);

  // Create initial nodes and links
  updateNodesAndLinks();

  // Add zoom behavior
  addZoomBehavior();

  // Prevent collapsing when clicking on empty space
  preventCollapseOnEmptyClick();
}

function updateGraph() {
  if (!zoneGraph.simulation || !zoneGraph.svg) return;

  // Update nodes and links
  updateNodesAndLinks();

  // Gently reheat the simulation
  zoneGraph.simulation.alpha(0.1).restart();
}

function updateNodesAndLinks() {
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const zoneTags = tagStore.tagsByZone(props.zone);
  const secondaryTags = zoneTags.flatMap(tag => tag.secondaryTags || []);

  // Preserve existing node positions
  const oldNodes = new Map(zoneGraph.nodes.map(d => [d.id, d]));
  zoneGraph.nodes = [...zoneTags].map(tag => ({
    ...tag,
    r: tag.size / 2,
    x: oldNodes.get(tag.id)?.x,
    y: oldNodes.get(tag.id)?.y,
    vx: oldNodes.get(tag.id)?.vx,
    vy: oldNodes.get(tag.id)?.vy,
  }));

  // zoneGraph.links = zoneTags.flatMap(tag => 
  //   tag.secondaryTags?.map(secTag => ({
  //     source: tag.id,
  //     target: secTag.id,
  //     value: 1,
  //   })) || []
  // );

  // Update simulation
  zoneGraph.simulation.nodes(zoneGraph.nodes);
  // zoneGraph.simulation.force("link").links(zoneGraph.links);

  // Update nodes
  const node = zoneGraph.svg.select(".nodes").selectAll("g")
    .data(zoneGraph.nodes, d => d.id);

  const nodeEnter = node.enter().append("g")
    .call(drag(zoneGraph.simulation))
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

  // Update links
  updateLinks();
}

function handleNodeClick(event, d) {
  event.stopPropagation();
  if (d.zone.includes('-secondary')) {
    emit('secondaryTagSelected', d.id);
  } else {
    emit('tagSelected', d.id);
  }
  updateNodeAppearance(d);
}

function updateLinks() {
  const link = zoneGraph.svg.select(".links").selectAll("line")
    .data(zoneGraph.links, d => `${d.source.id}-${d.target.id}`);

  link.enter()
    .append("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  link.exit().remove();
}

function setupSvgAndSimulation(width, height) {
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Filter tags for the current zone
  const zoneTags = tagStore.tagsByZone(props.zone);
  const secondaryTags = zoneTags.flatMap(tag => tag.secondaryTags || []);

  // Prepare nodes and links
  zoneGraph.nodes = [...zoneTags].map(tag => ({
    ...tag,
    r: tag.size / 2,
  }));

  // zoneGraph.links = zoneTags.flatMap(tag => 
  //   tag.secondaryTags?.map(secTag => ({
  //     source: tag.id,
  //     target: secTag.id,
  //     value: 1,
  //   })) || []
  // );

  zoneGraph.simulation = d3.forceSimulation(zoneGraph.nodes)
    // .force("link", d3.forceLink(zoneGraph.links).id(d => d.id).distance(50))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => d.r + 5))
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1));

  zoneGraph.svg = d3.select(chartContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Add a background rect to catch mouse events
  zoneGraph.svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  const g = zoneGraph.svg.append("g");

  const link = g.append("g")
    .attr("class", "links")
    .selectAll("line")
    .data(zoneGraph.links)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  const node = g.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(zoneGraph.nodes)
    .join("g")
    .call(drag(zoneGraph.simulation))
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

  zoneGraph.simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("transform", d => `translate(${d.x},${d.y})`);
  });
}

function addZoomBehavior() {
  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on("zoom", (event) => {
      zoneGraph.svg.select("g").attr("transform", event.transform);
    });

  zoneGraph.svg.call(zoom);
}

function preventCollapseOnEmptyClick() {
  // Prevent collapsing when clicking on empty space
  zoneGraph.svg.on("click", (event) => {
    if (event.target.tagName === "svg" || event.target.tagName === "rect") {
      event.stopPropagation();
    }
  });
}

function updateNodeAppearance(d) {
  const color = d3.scaleOrdinal(d3.schemeCategory10);
  const node = zoneGraph.svg.select(`.nodes g`).filter(n => n.id === d.id);
  
  const baseSize = d.zone.includes('-secondary') ? 30 : 40;
  const newSize = d.selected ? baseSize * 1.2 : baseSize;
  
  // Update only the specific node
  node.select("circle")
    .attr("fill", d.selected ? "#4CAF50" : color(d.zone))
    .attr("r", newSize / 2);
  
  node.select("text")
    .attr("y", newSize / 2 + 10);

  // Update the node data in the simulation
  const index = zoneGraph.nodes.findIndex(n => n.id === d.id);
  if (index !== -1) {
    zoneGraph.nodes[index] = { ...zoneGraph.nodes[index], ...d, size: newSize };
    zoneGraph.simulation.nodes(zoneGraph.nodes);
  }

  // Gently reheat the simulation for smooth transitions
  zoneGraph.simulation.alpha(0.1).restart();
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
</script>

<style scoped>
.selected {
  fill: #4CAF50;
}
</style>