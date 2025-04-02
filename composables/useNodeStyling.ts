import { type Selection } from 'd3';
import type { GraphNode } from '~/types/graph';

export function useNodeStyling() {
  /**
   * Applies styling to a graph node
   */
  const applyNodeStyle = (
    selection: Selection<any, GraphNode, any, any>,
    isHover = false
  ) => {
    // Apply circle styling
    selection.select('.node-circle')
      .attr('fill', d => d.selected ? '#6366f1' : 'rgba(255, 255, 255, 0.2)')
      .attr('stroke', d => {
        if (d.selected) return '#fff';
        return isHover ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)';
      })
      .attr('stroke-width', d => d.selected ? 1.5 : 1)
      .attr('r', d => d.size / 2);
    
    // Apply text styling - always keep dark text for readability
    selection.select('.node-text')
      .attr('fill', 'rgba(0, 0, 0, 0.8)')
      .attr('font-weight', d => d.selected ? '600' : '500')
      .attr('text-shadow', '0 0 4px rgba(255, 255, 255, 0.9)');
    
    // Selected nodes should be brought to front
    if (selection.data()[0]?.selected) {
      selection.raise();
    }
  };

  /**
   * Gets the image path for a subject node
   */
  const getSubjectImagePath = (text: string): string => {
    // Map the node text to the correct filename
    const nodeTextToFilename: Record<string, string> = {
      'Humans': 'humans',
      'Animals': 'animals',
      'Mythical Creatures': 'mythical-creatures',
      'Plants': 'plants',
      'Objects': 'objects',
      'Abstract Concepts': 'abstract-concepts',
      'Structures': 'structures',
      'Landscapes': 'landscapes'
    };
    
    const filename = nodeTextToFilename[text] || text.toLowerCase().replace(/\s+/g, '-');
    // Use dynamic imports of assets instead of hard-coded paths
    return new URL(`/assets/pics/subject/${filename}.png`, import.meta.url).href;
  };

  return {
    applyNodeStyle,
    getSubjectImagePath
  };
} 