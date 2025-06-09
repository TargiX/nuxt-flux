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
    
    // Validate nodes and fix invalid coordinates
    const validNodes = nodes.filter(n => n && typeof n.id === 'string');
    
    // Create O(1) parent lookup map for performance
    const parentMap = new Map(validNodes.map(n => [n.id, n]));
    
    // Use centerX/centerY for consistency
    const centerX = width / 2;
    const centerY = height / 2;

    const selectedParent = validNodes.find(n => n.selected && !n.parentId);
    const parentX = selectedParent && typeof selectedParent.x === 'number' && !isNaN(selectedParent.x) 
      ? selectedParent.x 
      : centerX;
    const parentY = selectedParent && typeof selectedParent.y === 'number' && !isNaN(selectedParent.y)
      ? selectedParent.y
      : centerY;

    // Update node positions and fix selected nodes
    validNodes.forEach(node => {
      // Force clear invalid positions or initialize if missing
      const hasValidX = typeof node.x === 'number' && !isNaN(node.x);
      const hasValidY = typeof node.y === 'number' && !isNaN(node.y);
      
      if (!hasValidX) node.x = centerX + (Math.random() - 0.5) * 10;
      if (!hasValidY) node.y = centerY + (Math.random() - 0.5) * 10;
      
      // Reset velocities only for new/invalid nodes - preserve momentum for stable nodes
      if (!hasValidX || !hasValidY) {
        node.vx = 0;
        node.vy = 0;
      }
       
      if (node.selected && !node.parentId) {
        // Pin selected top-level nodes
        node.fx = node.x;
        node.fy = node.y;
      } else if (node.parentId) {
        // Position child nodes near their parent - use O(1) lookup
        const parent = parentMap.get(node.parentId);
        if (parent) {
          const parentPosX = typeof parent.x === 'number' && !isNaN(parent.x) ? parent.x : centerX;
          const parentPosY = typeof parent.y === 'number' && !isNaN(parent.y) ? parent.y : centerY;
          
          // Small random offset from parent for initial positioning
          if (!hasValidX || !hasValidY) {
            node.x = parentPosX + (Math.random() - 0.5) * 30;
            node.y = parentPosY + (Math.random() - 0.5) * 30;
          }
        }
        // Let child nodes move freely
        node.fx = null;
        node.fy = null;
      } else {
        // Free top-level unselected nodes
        node.fx = null;
        node.fy = null;
      }
    });

    // Update simulation nodes with valid nodes only
    simulation.nodes(validNodes);
    
    // Update link force
    const linkForceTyped = simulation.force<d3.ForceLink<GraphNode, GraphLink>>('link');
    if (linkForceTyped) {
      // Filter links to only include valid references
      const validLinks = links.filter(link => {
        const sourceId = typeof link.source === 'string' ? link.source : (link.source as GraphNode)?.id;
        const targetId = typeof link.target === 'string' ? link.target : (link.target as GraphNode)?.id;
        
        return validNodes.some(n => n.id === sourceId) && validNodes.some(n => n.id === targetId);
      });
      
      linkForceTyped.links(validLinks);
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

    // Update center force
    const centerForce = simulation.force('center') as d3.ForceCenter<GraphNode>;
    if (centerForce) {
      centerForce.x(centerX).y(centerY);
    }

    // Restart simulation with your original alpha
    simulation.alpha(0.05).restart();
    
    return simulation;
  };
  
  /**
   * Creates a drag behavior for nodes
   */
  const createDragBehavior = (simulation: d3.Simulation<GraphNode, GraphLink>) => {
    return d3.drag<SVGGElement, GraphNode>()
      .clickDistance(5)
  
      // 1️⃣  <<—  Reject drags that start on text / inputs —>>
      .filter(event => {
        if (event.button !== 0) return false;             // only left-button
        const t = event.target as HTMLElement;
        if (t.tagName === 'text') return false;           // node label
        if (t.tagName === 'input') return false;          // inline editor
        if (t.closest('.node-text-editor-fo')) return false; // editor container
        return true;                                      // otherwise allow
      })
  
      .on('start', event => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on('drag', event => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on('end', event => {
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