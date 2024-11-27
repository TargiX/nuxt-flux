<template>
  <div class="relative" ref="chartContainer" :style="{ width: `${width}px`, height: `${height}px` }">
    <div v-if="!preview" class="absolute bottom-4 right-4 flex gap-2">
      <button 
        @click="handlePrevZone"
        class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200"
        :disabled="isFirstZone"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 rotate-180" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
        Prev
      </button>
      
      <button 
        @click="handleNextZone"
        class="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors duration-200"
        :disabled="isLastZone"
      >
        Next
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import * as d3 from 'd3';
import { useTagStore } from '~/store/tagStore';
import { ArrowPathIcon } from '@heroicons/vue/24/solid';
import type { Tag } from '~/store/tagStore'; // Import Tag type
import { gsap } from 'gsap';

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

// Initialize refs at the top level
const chartContainer = ref<HTMLElement | null>(null);
const selectedSecondaryTags = ref<Tag[]>([]);
const hybridCreationTimeout = ref<NodeJS.Timeout | null>(null);
const tagStore = useTagStore();

const RADIUS = 150; // Distance from parent for secondary nodes
const CHILD_RADIUS = 120; // Distance from hybrid parent to its children
const SECONDARY_NODE_SIZE = 30;
const PRIMARY_NODE_SIZE = 40;
const SECONDARY_NODE_ANGLE_STEP = (2 * Math.PI) / 10;

const emit = defineEmits(['tagSelected', 'secondaryTagSelected', 'zoneChange']);

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
  const secondaryTags = tagStore.getAllSecondaryTagsForZone(props.zone);
  const hybridTags = tagStore.getHybridTagsForZone(props.zone);

  // Extract child tags from hybrid tags and maintain their visibility state

  const selectedTag = zoneTags.find(tag => tag.selected && tag.isLoading);

  const oldNodes = new Map(zoneGraph.value.nodes.map(d => [d.id, d]));

  // Combine all nodes, preserving visibility states
  const nodes = [...zoneTags, ...secondaryTags].map((tag) => {
    const oldNode = oldNodes.get(tag.id);
    let x, y;

    // Preserve isHidden state from old node if it exists
    const isHidden = oldNode ? oldNode.isHidden : tag.isHidden;

    if (oldNode) {
      x = oldNode.x;
      y = oldNode.y;
    } else if (tag.isHybrid && tag.childTags) {
      const childPositions = tag.childTags
        .map(child => oldNodes.get(child.id))
        .filter(Boolean);
      
      if (childPositions.length > 0) {
        x = childPositions.reduce((sum, pos) => sum + pos.x, 0) / childPositions.length;
        y = childPositions.reduce((sum, pos) => sum + pos.y, 0) / childPositions.length;
      } else {
        x = props.width / 2;
        y = props.height / 2;
      }
    } else {
      x = props.width / 2;
      y = props.height / 2;
    }

    return {
      ...tag,
      r: tag.size / 2,
      x,
      y,
      vx: 0,
      vy: 0,
      isLoading: tag.isLoading,
      isHidden // Preserve the hidden state
    };
  });

  // Update node visibility in the DOM
  zoneGraph.value.svg.selectAll(".nodes g")
    .style("opacity", d => d.isHidden ? 0 : 1)
    .style("pointer-events", d => d.isHidden ? "none" : "all");

  // Store nodes in zoneGraph for future reference
  zoneGraph.value.nodes = nodes;

  const links = tagStore.createLinksBySourceId(props.zone);

  // Update link visibility - hide links connected to hidden nodes
  zoneGraph.value.svg.selectAll(".links line")
    .style("opacity", d => {
      const sourceNode = nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
      const targetNode = nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
      return (sourceNode?.isHidden || targetNode?.isHidden) ? 0 : 0.6;
    })
    .style("pointer-events", d => {
      const sourceNode = nodes.find(n => n.id === (typeof d.source === 'object' ? d.source.id : d.source));
      const targetNode = nodes.find(n => n.id === (typeof d.target === 'object' ? d.target.id : d.target));
      return (sourceNode?.isHidden || targetNode?.isHidden) ? "none" : "all";
    });

  tagStore.updateZoneGraph(props.zone, nodes, links);

  // Update simulation with separate forces for primary and secondary nodes
  zoneGraph.value.simulation.nodes(nodes);
  console.log('links', links)
  // Adjust force parameters
  zoneGraph.value.simulation
    .force("link", d3.forceLink(links)
      .id(d => d.id)
      .distance(link => {
        if (link.isHybridChainLink) {
          return RADIUS * 4;
        }
        if (link.isHybridLink) {
          return CHILD_RADIUS;
        }
        if (link.source.isHybrid || link.target.isHybrid) {
          return RADIUS * 5;
        }
        return RADIUS;
      })
      .strength(link => {
        // Only apply forces to non-hybrid links
        if (link.source.isHybrid || link.target.isHybrid || 
            link.isHybridChainLink || link.isHybridLink) {
          return 0;
        }
        return 0.5;
      })
    )
    .force("charge", d3.forceManyBody()
      .strength(d => {
        if (d.isHybrid || d.isHybridChild) {
          return 0;
        }
        return d.zone.includes('-secondary') ? -50 : -40;
      }))
    .force("collision", d3.forceCollide()
      .radius(d => {
        if (d.isHybrid) return d.r + 20;
        if (d.isHybridChild) return d.r + 10;
        return d.r + (d.zone.includes('-secondary') ? 30 : 20);
      })
      .strength(1)) // Maximum strength to prevent overlaps
    .force("centerPrimary", d3.forceRadial(0, props.width / 2, props.height / 2)
      .strength(d => {
        if (d.isHybrid || d.isHybridChild) {
          return 0;
        }
        return d.zone.includes('-secondary') ? 0 : 0.1;
      }))
    .force("circularSecondary", d3.forceRadial(RADIUS, props.width / 2, props.height / 2)
      .strength(d => {
        if (d.isHybrid || d.isHybridChild) {
          return 0;
        }
        return d.zone.includes('-secondary') ? 0.8 : 0;
      }));

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
  nodeEnter.each(function(d: any) {
    const node = d3.select(this);
    const lines = formatNodeText(d.text);
    
    lines.forEach((line, i) => {
      node.append("text")
        .text(line)
        .attr("x", 0)
        .attr("y", d.r + 10 + (i * 12)) // 12px line height
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("class", "node-text");
    });
  });

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
    // First ensure hybrid systems maintain their positions
    nodes.forEach(node => {
      if (node.fx !== null && node.fy !== null) {
        node.x = node.fx;
        node.y = node.fy;
      }
    });

    const links = zoneGraph.value.simulation.force("link").links();

    zoneGraph.value.link
      .data(links)
      .attr("x1", d => d.source.x || 0)
      .attr("y1", d => d.source.y || 0)
      .attr("x2", d => d.target.x || 0)
      .attr("y2", d => d.target.y || 0);

    zoneGraph.value.node
      .attr("transform", d => `translate(${d.x || 0},${d.y || 0})`);
  });

  // After updating nodes and links, update node colors
  updateNodeColors();
}


async function handleNodeClick(event: MouseEvent, d: Tag) {
  if (props.preview) return;
  event.stopPropagation();
  console.log('d', d)
  if (d.isHybrid) {
    d.selected = !d.selected;
    
    if (d.selected) {
      tagStore.addSelectedHybridTag(d);
    } else {
      tagStore.removeSelectedHybridTag(d.id, props.zone);
    }
    
    updateHybridRelatedNodes(d, !d.selected);
    updateNodeAppearance(d, false);
    updateGraph();
    return;
  }

  // Handle both secondary tags and hybrid child tags the same way
  if (d.zone.includes('-secondary') || d.isHybridChild) {
    // Toggle selection
    d.selected = !d.selected;
    updateNodeAppearance(d, false);
   
    if (d.isHybridChild) {
      const parentHybrid = tagStore.getHybridTagsForZone(props.zone)
        .find(hybrid => hybrid.childTags?.some(child => child.id === d.id));
      if (parentHybrid && parentHybrid.childTags) {
        const childTag = parentHybrid.childTags.find(child => child.id === d.id);
        if (childTag) {
          childTag.selected = d.selected;
        }
      }
    }
    // Get all selected tags from the same parent/context
    const selectedTags = zoneGraph.value.nodes.filter(node => {
      if (!node.selected || node.isHidden) return false;

      if (d.isHybridChild) {
        // If current tag is a hybrid child, only select other children of the same hybrid parent
        const parentHybrid = tagStore.getHybridTagsForZone(props.zone)
          .find(hybrid => hybrid.childTags?.some(child => child.id === d.id));
        return node.isHybridChild && parentHybrid?.childTags?.some(child => child.id === node.id);
      } else {
        // If current tag is a secondary tag, only select other secondary tags
        return node.zone.includes('-secondary') && !node.isHybridChild;
      }
    });

    if (d.selected) {
      // If we have 2 or more selected tags, create hybrid
      if (selectedTags.length >= 2) {
        if (hybridCreationTimeout.value) {
          clearTimeout(hybridCreationTimeout.value);
        }
        
        hybridCreationTimeout.value = setTimeout(async () => {
          const hybridTag = await tagStore.createHybridTag(props.zone, selectedTags);
          if (hybridTag) {
            // If we're combining hybrid child tags, attach the new hybrid to the parent hybrid
            if (d.isHybridChild) {
              const parentHybrid = tagStore.getHybridTagsForZone(props.zone)
                .find(hybrid => hybrid.childTags?.some(child => child.id === d.id));
              
              if (parentHybrid) {
                // Hide the source hybrid child tags
                selectedTags.forEach(tag => {
                  // Find and hide the tag in the parent hybrid's childTags array
                  const childTag = parentHybrid.childTags?.find(child => child.id === tag.id);
                  if (childTag) {
                    childTag.isHidden = true;
                    childTag.selected = false;
                  }
                });

                // Create link between parent hybrid and new hybrid
                const link = {
                  source: parentHybrid.id,
                  target: hybridTag.id,
                  value: 1,
                  isHybridLink: true,
                  isHybridChainLink: true // Special flag for hybrid-to-hybrid links
                };
                
                // Add to links
                zoneGraph.value.links.push(link);
              }
            }

            updateHybridRelatedNodes(hybridTag, false);
            selectedTags.forEach(tag => {
              tag.selected = false;
              updateNodeAppearance(tag, false);
            });
            updateGraph();
          }
        }, 1000);
      }
    } else {
      if (hybridCreationTimeout.value) {
        clearTimeout(hybridCreationTimeout.value);
      }
    }

    emit('secondaryTagSelected', d.id);
    return;
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

function setupSvgAndSimulation(width: number, height: number) {
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Filter tags for the current zone
  const zoneTags = tagStore.tagsByZone(props.zone);
  const secondaryTags = tagStore.getAllSecondaryTagsForZone(props.zone);
  const hybridTags = tagStore.getHybridTagsForZone(props.zone);

  // Prepare nodes with all necessary properties
  zoneGraph.value.nodes = [...zoneTags, ...secondaryTags, ...hybridTags].map(tag => ({
    ...tag,
    r: tag.isHybrid ? 15 : tag.size / 2,
    x: props.width / 2,
    y: props.height / 2,
    vx: 0,
    vy: 0
  }));

  // Create links after nodes are prepared
  zoneGraph.value.links = tagStore.createLinksBySourceId(props.zone);

  // Initialize simulation with prepared nodes
  const simulationForces = {
    link: d3.forceLink(zoneGraph.value.links)
      .id((d: any) => d.id)
      .distance(props.preview ? 20 : RADIUS)
      .strength(props.preview ? 0.8 : 0.3),
    charge: d3.forceManyBody()
      .strength(props.preview ? -20 : -30)
      .distanceMax(200),
    center: d3.forceCenter(width / 2, height / 2)
      .strength(props.preview ? 0.8 : 0.3),
    collision: d3.forceCollide()
      .radius((d: any) => d.r + (props.preview ? 1 : 10))
      .strength(props.preview ? 0.8 : 0.4),
    x: d3.forceX(width / 2).strength(props.preview ? 0.2 : 0.05),
    y: d3.forceY(height / 2).strength(props.preview ? 0.2 : 0.05)
  };

  // Create simulation with prepared nodes
  zoneGraph.value.simulation = d3.forceSimulation(zoneGraph.value.nodes)
    .force("link", simulationForces.link)
    .force("charge", simulationForces.charge)
    .force("center", simulationForces.center)
    .force("collision", simulationForces.collision)
    .force("x", simulationForces.x)
    .force("y", simulationForces.y)
    .alphaDecay(0.05);

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

  node.each(function(d: any) {
    const node = d3.select(this);
    const lines = formatNodeText(d.text);
    
    lines.forEach((line, i) => {
      node.append("text")
        .text(line)
        .attr("x", 0)
        .attr("y", d.r + 10 + (i * 12)) // 12px line height
        .attr("text-anchor", "middle")
        .attr("font-size", "10px")
        .attr("class", "node-text");
    });
  });

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

  const baseSize = d.zone.includes('-secondary') ? SECONDARY_NODE_SIZE : PRIMARY_NODE_SIZE;
  const nodeSize = d.isHybrid ? SECONDARY_NODE_SIZE : baseSize;

  nodes.each(function() {
    const node = d3.select(this);
    const circle = node.select("circle");
    circle.attr("r", nodeSize / 2);
    
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
    // Don't allow dragging of hybrid systems
    if (event.subject.isHybrid || event.subject.isHybridChild) return;

    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    if (event.subject.isHybrid || event.subject.isHybridChild) return;
    
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (event.subject.isHybrid || event.subject.isHybridChild) return;
    
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

// Add new function to handle hybrid-related visual updates
function updateHybridRelatedNodes(hybridTag: Tag, visible: boolean) {
  if (!hybridTag.sourceTags) return;

  // Only hide/show source tags
  const sourceIds = hybridTag.sourceTags.map(t => t.id);
  
  // Update visibility of source tags
  zoneGraph.value.svg.selectAll(".nodes g")
    .filter(d => sourceIds.includes(d.id))
    .transition()
    .duration(600)
    .style("opacity", visible ? 1 : 0)
    .style("pointer-events", visible ? "all" : "none");

  // Update their links
  zoneGraph.value.svg.selectAll(".links line")
    .filter(d => sourceIds.includes(d.source.id) || sourceIds.includes(d.target.id))
    .transition()
    .duration(600)
    .style("opacity", visible ? 0.6 : 0);

  // Ensure child tags are always visible
  if (hybridTag.childTags) {
    const childIds = hybridTag.childTags.map(t => t.id);
    zoneGraph.value.svg.selectAll(".nodes g")
      .filter(d => childIds.includes(d.id))
      .style("opacity", 1)
      .style("pointer-events", "all");
  }
}

// Add new function to handle next zone click
function handleNextZone() {
  const zones = tagStore.zones;
  const currentIndex = zones.indexOf(props.zone);
  const nextIndex = currentIndex < zones.length - 1 ? currentIndex + 1 : currentIndex;
  emit('zoneChange', zones[nextIndex]);
}

// Add these computed properties
const isFirstZone = computed(() => {
  const zones = tagStore.zones;
  return zones.indexOf(props.zone) === 0;
});

const isLastZone = computed(() => {
  const zones = tagStore.zones;
  return zones.indexOf(props.zone) === zones.length - 1;
});

// Add new function to handle previous zone click
function handlePrevZone() {
  const zones = tagStore.zones;
  const currentIndex = zones.indexOf(props.zone);
  const prevIndex = currentIndex > 0 ? currentIndex - 1 : 0;
  emit('zoneChange', zones[prevIndex]);
}

// Add this function near the top of the script section
function formatNodeText(text: string): string[] {
  // Split by spaces but keep prepositions with their following word
  const prepositions = ['of', 'in', 'on', 'at', 'by', 'for', 'with', 'to', '&', 'and'];
  const words = text.split(' ');
  const lines: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    if (prepositions.includes(words[i].toLowerCase()) && i < words.length - 1) {
      // Combine preposition with the next word
      lines.push(`${words[i]} ${words[i + 1]}`);
      i++; // Skip the next word since we've used it
    } else {
      lines.push(words[i]);
    }
  }
  
  return lines;
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

::v-deep .nodes g[data-is-hybrid="true"] circle {
  stroke: #4CAF50;
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
