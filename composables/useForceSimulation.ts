import * as d3 from 'd3';
import type { GraphNode, GraphLink } from '~/types/graph';
import type { SimulationNodeDatum } from 'd3';

export function useForceSimulation() {
  /**
   * Creates and configures a D3 force simulation
   */
  const createSimulation = (
    nodes: GraphNode[],
    links: GraphLink[],
    width: number,
    height: number
  ) => {
    const simulation = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links)
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
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.00))
      .force('collision', d3.forceCollide()
        .radius((d) => ((d as GraphNode).selected ? (d as GraphNode).size : (d as GraphNode).size / 2) + 20)) // Larger collision radius for selected nodes
      .velocityDecay(0.8);
      
    return simulation;
  };
  
  /**
   * Updates the simulation parameters when nodes or links change
   */
  const updateSimulation = (
    simulation: d3.Simulation<GraphNode, GraphLink>,
    nodes: GraphNode[],
    links: GraphLink[],
    width: number,
    height: number
  ) => {
    simulation.stop();

    const selectedParent = nodes.find(n => n.selected && !n.parentId);
    const parentX = selectedParent ? (selectedParent.x || width / 2) : width / 2;
    const parentY = selectedParent ? (selectedParent.y || height / 2) : height / 2;

    // Update node positions and fix selected nodes
    nodes.forEach(node => {
      if (node.selected && !node.parentId) {
        node.fx = node.x || parentX;
        node.fy = node.y || parentY;
      } else if (node.parentId) {
        const parent = nodes.find(n => n.id === node.parentId);
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

    // Update simulation nodes
    simulation.nodes(nodes);
    
    // Update link force
    const linkForceTyped = simulation.force<d3.ForceLink<GraphNode, GraphLink>>('link');
    if (linkForceTyped) {
      linkForceTyped.links(links);
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

    // Update charge force
    const chargeForce = simulation.force('charge') as d3.ForceManyBody<GraphNode>;
    if (chargeForce) {
      chargeForce.strength((d: SimulationNodeDatum) => ((d as GraphNode).selected ? -100 : -20));
    }

    // Update collision force
    const collisionForce = simulation.force('collision') as d3.ForceCollide<GraphNode>;
    if (collisionForce) {
      collisionForce.radius((d: SimulationNodeDatum) => ((d as GraphNode).selected ? (d as GraphNode).size : (d as GraphNode).size / 2) + 20);
    }

    // Restart simulation
    simulation.alpha(0.3).restart();
    
    return simulation;
  };
  
  /**
   * Creates a drag behavior for nodes
   */
  const createDragBehavior = (simulation: d3.Simulation<GraphNode, GraphLink>) => {
    return d3.drag<any, GraphNode>()
      .on('start', (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  };
  
  return {
    createSimulation,
    updateSimulation,
    createDragBehavior
  };
} 