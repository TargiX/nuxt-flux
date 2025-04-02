import { type Selection } from 'd3';
import type { GraphLink, GraphNode } from '~/types/graph';

export function useLinkStyling() {
  /**
   * Creates a link gradient definition in the SVG
   */
  const createLinkGradient = (
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    id: string = 'link-gradient'
  ) => {
    // Create default gradient for links
    const linkGradient = svg.select('defs')
      .append('linearGradient')
      .attr('id', id)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    // Add stops to the gradient - subtle fade
    linkGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#aaa')
      .attr('stop-opacity', '0');
      
    linkGradient.append('stop')
      .attr('offset', '20%')
      .attr('stop-color', '#aaa')
      .attr('stop-opacity', '0.5');
      
    linkGradient.append('stop')
      .attr('offset', '80%')
      .attr('stop-color', '#aaa')
      .attr('stop-opacity', '0.5');
      
    linkGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#aaa')
      .attr('stop-opacity', '0');
      
    return linkGradient;
  };

  /**
   * Creates a unique gradient for a specific link
   */
  const createUniqueGradient = (
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    source: GraphNode,
    target: GraphNode
  ): string => {
    const gradientId = `link-gradient-${source.id}-${target.id}`;
    
    // Check if this gradient already exists
    if (svg.select(`#${gradientId}`).empty()) {
      // Create a new gradient for this link
      createLinkGradient(svg, gradientId);
      
      // Update the gradient orientation
      updateGradientPositions(svg, source, target);
    }
    
    return gradientId;
  };
  
  /**
   * Updates gradient positions based on node positions
   */
  const updateGradientPositions = (
    svg: Selection<SVGSVGElement, unknown, null, undefined>,
    source: GraphNode,
    target: GraphNode
  ) => {
    const gradientId = `link-gradient-${source.id}-${target.id}`;
    svg.select(`#${gradientId}`)
      .attr('x1', source.x || 0)
      .attr('y1', source.y || 0)
      .attr('x2', target.x || 0)
      .attr('y2', target.y || 0);
  };
  
  /**
   * Apply styling to a link
   */
  const applyLinkStyle = (
    selection: Selection<any, GraphLink, any, any>
  ) => {
    selection
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', d => Math.max(1, Math.sqrt(d.value) * 0.7))
      .attr('stroke-linecap', 'round');
  };

  return {
    createLinkGradient,
    createUniqueGradient,
    updateGradientPositions,
    applyLinkStyle
  };
} 