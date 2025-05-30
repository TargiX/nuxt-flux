import { type Selection } from 'd3';
import type { GraphNode } from '~/types/graph';
import * as d3 from 'd3';

// Helper to check if currently editing
let currentlyEditingNodeId: string | null = null;
let activeInput: HTMLInputElement | null = null;
// Track if we've initialized the event handlers
// let eventHandlersInitialized = false; // No longer needed here

// Add a cleanup flag to prevent double-removal
let isCleaningUp = false;


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
        
        // Add glow filter for selected nodes
        if (defs.select(`#glow-${zone.toLowerCase()}`).empty()) {
          const filter = defs.append('filter')
            .attr('id', `glow-${zone.toLowerCase()}`)
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
            
          // Add stronger blur effect for selected nodes
          filter.append('feGaussianBlur')
            .attr('stdDeviation', '3')
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
          .attr('x', '-50%')
          .attr('y', '-50%')
          .attr('width', '200%')
          .attr('height', '200%');
          
        filter.append('feGaussianBlur')
          .attr('stdDeviation', '3')
          .attr('result', 'blur');
          
        filter.append('feComposite')
          .attr('in', 'SourceGraphic')
          .attr('in2', 'blur')
          .attr('operator', 'over');
      }
    }
    
    // Create loading animation filter
    if (defs.select('#loading-pulse').empty()) {
      const filter = defs.append('filter')
        .attr('id', 'loading-pulse')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
        
      // Create pulsing effect with feGaussianBlur
      const blur = filter.append('feGaussianBlur')
        .attr('stdDeviation', '2')
        .attr('result', 'blur');
        
      // Add animation to the blur
      blur.append('animate')
        .attr('attributeName', 'stdDeviation')
        .attr('values', '2;4;2')
        .attr('dur', '1.5s')
        .attr('repeatCount', 'indefinite');
        
      filter.append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'blur')
        .attr('operator', 'over');
    }
  };
  
  /**
   * Gets the gradient URL for a node based on its zone and state
   */
  const getNodeGradient = (node: GraphNode): string => {
    // Loading state - use a subtle pulsing effect
    if (node.isLoading) {
      return 'rgba(255, 255, 255, 0.4)';
    }
    
    // Unselected nodes - subtle background
    if (!node.selected) {
      return 'rgba(255, 255, 255, 0.15)';
    }
    
    // Selected nodes - full gradient based on zone
    const zone = node.zone || 'default';
    const normalizedZone = Object.keys(zoneGradients).find(
      z => z.toLowerCase() === zone.toLowerCase()
    ) || 'default';
    
    return `url(#node-gradient-${normalizedZone.toLowerCase()})`;
  };
  
  /**
   * Gets the appropriate glow filter for a node based on its state
   */
  const getNodeGlowFilter = (node: GraphNode): string | null => {
    // Loading state - use pulsing animation
    if (node.isLoading) {
      return 'url(#loading-pulse)';
    }
    
    // Selected nodes get zone-specific glow
    if (node.selected) {
      const zone = node.zone || 'default';
      const normalizedZone = Object.keys(zoneGradients).find(
        z => z.toLowerCase() === zone.toLowerCase()
      ) || 'default';
      
      return `url(#glow-${normalizedZone.toLowerCase()})`;
    }
    
    return null;
  };

  /**
   * Applies styling to a graph node, including editable text
   */
  const applyNodeStyle = (
    selection: Selection<any, GraphNode, any, any>,
    isHover = false,
    svg?: Selection<any, unknown, null, undefined> | null,
    textUpdateCallback?: (nodeId: string, newText: string) => void
  ) => {
    if (svg) {
      createNodeGradients(svg);
    }
    
    selection.select('.node-circle')
      .attr('fill', d => getNodeGradient(d))
      .attr('filter', d => {
        if (d.isLoading || d.selected) {
          return getNodeGlowFilter(d);
        }
        return isHover ? 'url(#glow-default)' : null;
      })
      .attr('stroke', d => {
        if (d.isLoading) return 'rgba(255, 255, 255, 0.8)';
        if (d.selected) return '#fff';
        return isHover ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)';
      })
      .attr('stroke-width', d => {
        if (d.isLoading) return 2;
        if (d.selected) return 2;
        return isHover ? 2 : 1;
      })
      .attr('r', d => {
        const baseRadius = d.size / 2;
        if (d.isLoading) return baseRadius * 1.05;
        if (isHover && !d.selected) return baseRadius * 1.03;
        return baseRadius;
      })
      .style('opacity', d => {
        if (d.isLoading) return 0.8;
        return 1;
      })
      .style('transition', 'all 0.2s ease');
    
    const formatNodeText = (text: string): string[] => {
      const words = text.split(' ');
      if (words.length <= 1) return [text];
      if (words.length === 2) return words;
      if (words.length === 3) return [words[0], `${words[1]} ${words[2]}`];
      const firstLineCount = Math.ceil(words.length / 2);
      return [words.slice(0, firstLineCount).join(' '), words.slice(firstLineCount).join(' ')];
    };
    
    selection.each(function(d) {
      const nodeGroup = d3.select(this);
      nodeGroup.selectAll('.node-text, .node-text-editor-fo, .loading-indicator').remove();

      // Create text elements (click handler is removed from here)
      const textLines = formatNodeText(d.text);
      const textElements: d3.Selection<SVGTextElement, unknown, any, any>[] = [];
      textLines.forEach((line, i) => {
        const yPos = d.size / 2 + 8 + (i * 14);
        const textElement = nodeGroup.append('text')
          .attr('class', 'node-text')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .attr('font-size', d.selected ? '11px' : '10px')
          .attr('fill', (nodeData: unknown) => {
            const node = nodeData as GraphNode;
            if (node.isLoading) return 'rgba(255, 255, 255, 0.6)';
            if (node.selected) return 'rgba(255, 255, 255, 0.95)';
            return 'rgba(255, 255, 255, 0.8)';
          })
          .attr('font-weight', (nodeData: unknown) => {
            const node = nodeData as GraphNode;
            if (node.selected) return '700';
            if (node.isLoading) return '500';
            return '500';
          })
          .attr('text-shadow', (nodeData: unknown) => {
            const node = nodeData as GraphNode;
            if (node.selected) return '0 0 6px rgba(255, 255, 255, 0.9)';
            return '0 0 4px rgba(255, 255, 255, 0.7)';
          })
          .style('cursor', d.isLoading ? 'default' : 'text') // Maintained for visual cue
          .style('pointer-events', d.isLoading ? 'none' : 'auto') // Maintained
          .style('user-select', 'none')
          .style('paint-order', 'stroke fill')
          .style('stroke', 'transparent')
          .style('stroke-width', '6px')
          .text(line)
          .attr('data-node-id', d.id)
          .raise();
        textElements.push(textElement);
        // Reattach click handler for text editing
        if (textUpdateCallback && !d.isLoading) {
          textElement.on('click.textEdit', function(event) {
            event.stopPropagation();
            startTextEdit(event, d, nodeGroup.node() as SVGGElement, textElements, textUpdateCallback);
          });
        }
      });

      if (d.isLoading) {
        const spinnerGroup = nodeGroup.append('g')
          .attr('class', 'loading-indicator')
          .attr('transform', `translate(0, 0)`);
        spinnerGroup.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', 18)
          .attr('fill', 'rgba(255, 255, 255, 0.1)')
          .attr('stroke', 'none');
        const spinnerRadius = 13;
        const strokeWidth = 2;
        const spinner = spinnerGroup.append('circle')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', spinnerRadius)
          .attr('fill', 'none')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', strokeWidth)
          .attr('stroke-linecap', 'round')
          .attr('stroke-dasharray', `${spinnerRadius * 2 * Math.PI * 0.25} ${spinnerRadius * 2 * Math.PI * 0.75}`)
          .attr('transform-origin', '0 0');
        spinner.append('animateTransform')
          .attr('attributeName', 'transform')
          .attr('attributeType', 'XML')
          .attr('type', 'rotate')
          .attr('from', '0 0 0')
          .attr('to', '360 0 0')
          .attr('dur', '1s')
          .attr('repeatCount', 'indefinite');
      }
    });
    
    if (selection.data().length > 0 && selection.data()[0]?.selected) {
      selection.raise();
    }
  };
  
  function startTextEdit(
    event: any, 
    d: GraphNode, 
    nodeElement: SVGGElement, // Changed from nodeGroup to the actual g.node element
    textElementsToHide: d3.Selection<SVGTextElement, unknown, any, any>[],
    textUpdateCallback: (nodeId: string, newText: string) => void
  ) {
    console.log('Starting text edit for node:', d.id);
    currentlyEditingNodeId = d.id;

    textElementsToHide.forEach(el => el.style('display', 'none'));

    let firstLineY = d.size / 2 + 6;
    const approxInputHeight = 20;
    const inputWidth = 100;

    const foreignObject = d3.select(nodeElement).append('foreignObject') // Append to the specific node element
      .attr('class', 'node-text-editor-fo')
      .attr('x', -inputWidth / 2)
      .attr('y', firstLineY - 2)
      .attr('width', inputWidth)
      .attr('height', approxInputHeight)
      .style('overflow', 'visible');

    const input = foreignObject.append('xhtml:input')
      .attr('type', 'text')
      .attr('value', d.text)
      .style('width', `${inputWidth}px`)
      .style('height', `${approxInputHeight}px`)
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0')
      .style('font-size', '10px')
      .style('text-align', 'center')
      .style('border', '1px solid #ccc')
      .style('border-radius', '3px')
      .style('padding', '1px 3px')
      .style('box-shadow', '0 1px 3px rgba(0,0,0,0.1)')
      .style('color', 'rgba(0, 0, 0, 0.8)')
      .style('background-color', 'rgba(255, 255, 255, 0.95)')
      .node() as HTMLInputElement;

    activeInput = input;
    input.focus();
    input.select();

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTextEdit(d.id, input.value, foreignObject, textElementsToHide, textUpdateCallback);
      } else if (e.key === 'Escape') {
        cancelTextEdit(foreignObject, textElementsToHide);
      }
    });

    input.addEventListener('blur', () => {
      if (currentlyEditingNodeId === d.id) {
        cancelTextEdit(foreignObject, textElementsToHide);
      }
    });
  }

  function saveTextEdit(
    nodeId: string, 
    newValue: string, 
    foreignObject: Selection<any, unknown, null, undefined>, // Corrected type
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[],
    textUpdateCallback: (nodeId: string, newText: string) => void
  ) {
    console.log(`Saving text for ${nodeId}: ${newValue}`);
    if (isCleaningUp) return;
    isCleaningUp = true;
    textUpdateCallback(nodeId, newValue);
    try {
      cleanupEdit(foreignObject, originalTextElements);
    } catch (error) {
      console.warn('Error during edit cleanup:', error);
      currentlyEditingNodeId = null;
      activeInput = null;
    } finally {
      isCleaningUp = false;
    }
  }

  function cancelTextEdit(
    foreignObject: Selection<any, unknown, null, undefined>, // Corrected type
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[]
  ) {
    console.log(`Cancelling text edit for ${currentlyEditingNodeId}`);
    if (isCleaningUp) return;
    isCleaningUp = true;
    try {
      cleanupEdit(foreignObject, originalTextElements);
    } catch (error) {
      console.warn('Error during edit cleanup:', error);
      currentlyEditingNodeId = null;
      activeInput = null;
    } finally {
      isCleaningUp = false;
    }
  }
  
  function cleanupEdit(
    foreignObject: Selection<any, unknown, null, undefined>, // Corrected type
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[]
  ) {
    if (!foreignObject.empty()) {
      try {
        foreignObject.remove();
      } catch (error) {
        console.warn('Error removing foreignObject:', error);
      }
    }
    try {
      originalTextElements.forEach(el => el.style('display', null));
    } catch (error) {
      console.warn('Error restoring text elements:', error);
    }
    currentlyEditingNodeId = null;
    activeInput = null;
  }

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
    createNodeGradients,
    // Expose text editing functions
    startTextEdit,
    // saveTextEdit, // Not directly called from ForceGraph
    // cancelTextEdit, // Not directly called from ForceGraph
    // cleanupEdit // Not directly called from ForceGraph
  };
} 