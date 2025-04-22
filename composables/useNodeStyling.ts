import { type Selection } from 'd3';
import type { GraphNode } from '~/types/graph';
import * as d3 from 'd3';

export function useNodeStyling() {
  /**
   * Maps zone names to their gradient colors
   */
  const zoneGradients = {
    'Subject': { 
      light: '#A38BFE',  // Lighter lavender
      main: '#A38BFE',   // Main lavender
      dark: '#65F0D5'    // Mint accent
    },
    'Attributes': { 
      light: '#FF8AE2',  // Lighter pink
      main: '#FF8AE2',   // Main pink
      dark: '#FFC46B'    // Gold accent
    },
    'Activity': { 
      light: '#84FFF5',  // Lighter cyan
      main: '#84FFF5',   // Main cyan
      dark: '#4C6EF5'    // Indigo accent
    },
    'Composition': { 
      light: '#F6D365',  // Lighter yellow
      main: '#F6D365',   // Main yellow
      dark: '#FDA085'    // Peach accent
    },
    'Aesthetics': { 
      light: '#C2FFD8',  // Lighter mint
      main: '#C2FFD8',   // Main mint
      dark: '#465EFB'    // Blue accent
    },
    'Mood': { 
      light: '#F9D423',  // Lighter gold
      main: '#F9D423',   // Main gold
      dark: '#FF4E50'    // Red accent
    },
    'Setting': { 
      light: '#9EAAFF',  // Lighter indigo
      main: '#667EEA',   // Main indigo
      dark: '#764BA2'    // Purple accent
    },
    'Layout': { 
      light: '#FFD870',  // Lighter gold
      main: '#FFD870',   // Main gold
      dark: '#E5B845'    // Peach accent
    }
  };

  // Default gradient for fallback
  const defaultGradient = { 
    light: '#9B9DFF',
    main: '#6366f1', 
    dark: '#8B5CF6' 
  };
  
  /**
   * Creates node gradient definitions in the SVG
   */
  const createNodeGradients = (svg: Selection<SVGSVGElement, unknown, null, undefined>) => {
    // First check if we already have defs
    if (svg.select('defs').empty()) {
      svg.append('defs');
    }
    
    const defs = svg.select('defs');
    
    // Create gradients for each zone
    Object.entries(zoneGradients).forEach(([zone, colors]) => {
      const gradientId = `node-gradient-${zone.toLowerCase()}`;
      
      // Only create if it doesn't exist yet
      if (defs.select(`#${gradientId}`).empty()) {
        // Create a radial gradient for sphere-like effect
        const gradient = defs.append('radialGradient')
          .attr('id', gradientId)
          .attr('cx', '30%')      // Move highlight more to the top-left
          .attr('cy', '30%')
          .attr('r', '80%')       // Cover more of the circle
          .attr('fx', '7%')      // Focus highlight in top-left corner
          .attr('fy', '7%');
          
        // Start with a lighter version of the main color at center
        gradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', colors.light)  // Lighter shade
          .attr('stop-opacity', '1');
          
        // Transition to main color
        gradient.append('stop')
          .attr('offset', '30%')
          .attr('stop-color', colors.main)   // Main color
          .attr('stop-opacity', '1');
          
        // Transition to darker end color
        gradient.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', colors.dark)   // Darker accent color
          .attr('stop-opacity', '0.9');
        
        // Add glow filter
        if (defs.select(`#glow-${zone.toLowerCase()}`).empty()) {
          const filter = defs.append('filter')
            .attr('id', `glow-${zone.toLowerCase()}`)
            .attr('x', '-30%')
            .attr('y', '-30%')
            .attr('width', '160%')
            .attr('height', '160%');
            
          // Add subtle blur effect
          filter.append('feGaussianBlur')
            .attr('stdDeviation', '1.5')
            .attr('result', 'blur');
            
          // Combine original with blur
          filter.append('feComposite')
            .attr('in', 'SourceGraphic')
            .attr('in2', 'blur')
            .attr('operator', 'over');
        }
      }
    });
    
    // Create default gradient
    if (defs.select('#node-gradient-default').empty()) {
      const gradient = defs.append('radialGradient')
        .attr('id', 'node-gradient-default')
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '80%')
        .attr('fx', '15%')
        .attr('fy', '15%');
        
      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', defaultGradient.light)
        .attr('stop-opacity', '1');
        
      gradient.append('stop')
        .attr('offset', '30%')
        .attr('stop-color', defaultGradient.main)
        .attr('stop-opacity', '1');
        
      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', defaultGradient.dark)
        .attr('stop-opacity', '0.9');
        
      // Add default glow
      if (defs.select('#glow-default').empty()) {
        const filter = defs.append('filter')
          .attr('id', 'glow-default')
          .attr('x', '-30%')
          .attr('y', '-30%')
          .attr('width', '160%')
          .attr('height', '160%');
          
        filter.append('feGaussianBlur')
          .attr('stdDeviation', '1.5')
          .attr('result', 'blur');
          
        filter.append('feComposite')
          .attr('in', 'SourceGraphic')
          .attr('in2', 'blur')
          .attr('operator', 'over');
      }
    }
  };
  
  /**
   * Gets the gradient URL for a node based on its zone
   */
  const getNodeGradient = (node: GraphNode): string => {
    if (!node.selected) {
      return 'rgba(255, 255, 255, 0.2)';
    }
    
    const zone = node.zone || 'default';
    const normalizedZone = Object.keys(zoneGradients).find(
      z => z.toLowerCase() === zone.toLowerCase()
    ) || 'default';
    
    return `url(#node-gradient-${normalizedZone.toLowerCase()})`;
  };
  
  /**
   * Gets the glow filter URL for a node based on its zone
   */
  const getNodeGlowFilter = (node: GraphNode): string | null => {
    if (!node.selected) {
      return null;
    }
    
    const zone = node.zone || 'default';
    const normalizedZone = Object.keys(zoneGradients).find(
      z => z.toLowerCase() === zone.toLowerCase()
    ) || 'default';
    
    return `url(#glow-${normalizedZone.toLowerCase()})`;
  };

  /**
   * Applies styling to a graph node
   */
  const applyNodeStyle = (
    selection: Selection<any, GraphNode, any, any>,
    isHover = false,
    svg?: Selection<SVGSVGElement, unknown, null, undefined> | null
  ) => {
    // Create gradients if we have the SVG reference
    if (svg) {
      createNodeGradients(svg);
    }
    
    // Apply circle styling
    selection.select('.node-circle')
      .attr('fill', d => getNodeGradient(d))
      .attr('filter', d => isHover && d.selected ? getNodeGlowFilter(d) : null)
      .attr('stroke', d => {
        if (d.selected) return '#fff';
        return isHover ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.5)';
      })
      .attr('stroke-width', d => d.selected ? 1.5 : 1)
      .attr('r', d => d.size / 2);
    
    // Update text content and styling
    selection.selectAll('.node-text').remove(); // Remove existing text
    
    // Function to format text into multiple lines if needed
    const formatNodeText = (text: string): string[] => {
      const words = text.split(' ');
      
      // If single word or empty, return as is
      if (words.length <= 1) {
        return [text];
      }
      
      // For two words, split into two lines
      if (words.length === 2) {
        return words;
      }
      
      // For three words, put first word on first line, remaining on second
      if (words.length === 3) {
        return [
          words[0],
          `${words[1]} ${words[2]}`
        ];
      }
      
      // For more than three words, try to balance lines
      // Prioritize putting fewer words on the first line
      const firstLineCount = Math.floor(words.length / 2);
      return [
        words.slice(0, firstLineCount).join(' '),
        words.slice(firstLineCount).join(' ')
      ];
    };
    
    // Add text labels directly to the node (not in a group)
    selection.each(function(d) {
      const node = d3.select(this);
      const textLines = formatNodeText(d.text);
      
      // Remove any existing node-text
      node.selectAll('.node-text').remove();
      
      // For single-line text, use the standard approach
      if (textLines.length === 1) {
        node.append('text')
          .attr('class', 'node-text')
          .attr('x', 0) // Center horizontally
          .attr('y', d.size / 2 + 6) // Position below the circle
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging') // Align from the top of the text
          .attr('font-size', '10px')
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('font-weight', d.selected ? '600' : '500')
          .attr('text-shadow', '0 0 4px rgba(255, 255, 255, 0.9)')
          .text(d.text);
        return;
      }
      
      // For multi-line text, create separate text elements
      textLines.forEach((line, i) => {
        const yPos = d.size / 2 + 6 + (i * 12); // Start closer to node and add line height
        
        node.append('text')
          .attr('class', 'node-text')
          .attr('x', 0) // Center horizontally
          .attr('y', yPos) // Position based on line number
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging') // Align from the top of the text
          .attr('font-size', '10px')
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('font-weight', d.selected ? '600' : '500')
          .attr('text-shadow', '0 0 4px rgba(255, 255, 255, 0.9)')
          .text(line);
      });
    });
    
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
    getSubjectImagePath,
    createNodeGradients
  };
} 