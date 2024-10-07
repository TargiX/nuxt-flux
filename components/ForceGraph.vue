<template>
  <div ref="chartContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import * as d3 from 'd3';
import { useTagStore } from '~/store/tagStore';

const props = defineProps<{
  width: number;
  height: number;
  zone: string;
}>();

const emit = defineEmits(['tagSelected']);

const chartContainer = ref<HTMLElement | null>(null);
const tagStore = useTagStore();

onMounted(() => {
  createForceGraph();
});

watch(() => tagStore.tags, createForceGraph, { deep: true });

function createForceGraph() {
  if (!chartContainer.value) return;

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove();

  const { width, height, zone } = props;
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Filter tags for the current zone
  const zoneTags = tagStore.tagsByZone(zone);
  const secondaryTags = zoneTags.flatMap(tag => tag.secondaryTags || []);

  // Prepare nodes and links
  const nodes = [...zoneTags, ...secondaryTags].map(tag => ({
    ...tag,
    r: tag.size / 2,
  }));

  const links = zoneTags.flatMap(tag => 
    tag.secondaryTags?.map(secTag => ({
      source: tag.id,
      target: secTag.id,
      value: 1,
    })) || []
  );

  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(50))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => d.r + 5))
    .force("x", d3.forceX(width / 2).strength(0.1))
    .force("y", d3.forceY(height / 2).strength(0.1));

  const svg = d3.select(chartContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto;");

  // Add a background rect to catch mouse events
  svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "none")
    .attr("pointer-events", "all");

  const g = svg.append("g");

  const link = g.append("g")
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", d => Math.sqrt(d.value));

  const node = g.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .call(drag(simulation))
    .on("click", (event, d) => {
      event.stopPropagation();
      emit('tagSelected', d.id);
      d3.select(event.currentTarget).select("circle")
        .attr("fill", d.selected ? color(d.zone) : "#4CAF50");
    });

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

  simulation.on("tick", () => {
    link
      .attr("x1", d => Math.max(d.r, Math.min(width - d.r, d.source.x)))
      .attr("y1", d => Math.max(d.r, Math.min(height - d.r, d.source.y)))
      .attr("x2", d => Math.max(d.r, Math.min(width - d.r, d.target.x)))
      .attr("y2", d => Math.max(d.r, Math.min(height - d.r, d.target.y)));

    node
      .attr("transform", d => `translate(${Math.max(d.r, Math.min(width - d.r, d.x))},${Math.max(d.r, Math.min(height - d.r, d.y))})`);
  });

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.5, 2])
    .on("zoom", (event) => {
      g.attr("transform", event.transform);
    });

  svg.call(zoom);

  // Prevent collapsing when clicking on empty space
  svg.on("click", (event) => {
    if (event.target.tagName === "svg" || event.target.tagName === "rect") {
      event.stopPropagation();
    }
  });
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