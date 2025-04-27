import { type Selection } from 'd3';
import type { GraphNode } from '~/types/graph';
import * as d3 from 'd3';

// Helper to check if currently editing
let currentlyEditingNodeId: string | null = null;
let activeInput: HTMLInputElement | null = null;
// Store the callback globally to avoid recreating it
let globalTextUpdateCallback: ((nodeId: string, newText: string) => void) | null = null;
// Track if we've initialized the event handlers
let eventHandlersInitialized = false;

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
   * Applies styling to a graph node, including editable text
   */
  const applyNodeStyle = (
    selection: Selection<any, GraphNode, any, any>,
    isHover = false,
    svg?: Selection<any, unknown, null, undefined> | null,
    textUpdateCallback?: (nodeId: string, newText: string) => void
  ) => {
    // Store the callback globally if provided
    if (textUpdateCallback) {
      globalTextUpdateCallback = textUpdateCallback;
      
      // Initialize global event handlers only once
      if (!eventHandlersInitialized && svg && svg.node()) {
        console.log('Initializing global handlers');
        initializeGlobalEventHandlers(svg);
      }
    }
    
    // Create gradients if needed
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
    
    // Text Formatting Function
    const formatNodeText = (text: string): string[] => {
      const words = text.split(' ');
      if (words.length <= 1) return [text];
      if (words.length === 2) return words;
      if (words.length === 3) return [words[0], `${words[1]} ${words[2]}`];
      const firstLineCount = Math.floor(words.length / 2);
      return [words.slice(0, firstLineCount).join(' '), words.slice(firstLineCount).join(' ')];
    };
    
    // --- Text Handling --- 
    selection.each(function(d) {
      const nodeGroup = d3.select(this);
      
      // Remove any previous text elements or foreignObjects to avoid duplication
      nodeGroup.selectAll('.node-text, .node-text-editor-fo').remove();

      // Create text elements
      const textLines = formatNodeText(d.text);
      const textElements: d3.Selection<SVGTextElement, unknown, any, any>[] = [];
      
      textLines.forEach((line, i) => {
        const yPos = d.size / 2 + 6 + (i * 12);
        const textElement = nodeGroup.append('text')
          .attr('class', 'node-text')
          .attr('x', 0)
          .attr('y', yPos)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'hanging')
          .attr('font-size', '10px')
          .attr('fill', 'rgba(0, 0, 0, 0.8)')
          .attr('font-weight', d.selected ? '600' : '500')
          .attr('text-shadow', '0 0 4px rgba(255, 255, 255, 0.9)')
          .style('cursor', 'text')
          .style('pointer-events', 'auto')
          .text(line)
          .attr('data-node-id', d.id);
          
        // TEMPORARY: Add direct click handler to each text element
        // This is less efficient but will help diagnose issues
        if (globalTextUpdateCallback) {
          textElement.on('click', function(event) {
            console.log('Direct text click:', d.id);
            event.stopPropagation();
            if (currentlyEditingNodeId !== null) return;
            
            // Use non-null assertion since we already checked it's not null
            startTextEdit(event, d, nodeGroup as any, textElements, globalTextUpdateCallback!);
          });
        }
        
        textElements.push(textElement);
      });
    });
    
    // Selected nodes should be brought to front
    if (selection.data().length > 0 && selection.data()[0]?.selected) {
      selection.raise();
    }
  };
  
  /**
   * Set up global event delegation for text editing
   */
  function initializeGlobalEventHandlers(svg: Selection<any, unknown, null, undefined>) {
    if (eventHandlersInitialized) return;
    
    const svgNode = svg.node();
    if (!svgNode) return;
    
    // For debugging - add a click handler to the SVG root
    svgNode.addEventListener('click', (e: Event) => {
      const target = e.target as Element;
      console.log('SVG click event:', {
        target: target.tagName,
        classes: target.classList.toString(),
        isText: target.tagName.toLowerCase() === 'text',
        hasNodeTextClass: target.classList.contains('node-text'),
        attributes: {
          nodeId: target.getAttribute('data-node-id')
        }
      });
    });
    
    eventHandlersInitialized = true;
    console.log('Global text editing event handlers initialized');
  }
  
  // --- Edit Functions --- 
  
  function startTextEdit(
    event: any, 
    d: GraphNode, 
    nodeGroup: Selection<any, GraphNode, any, any>,
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[],
    textUpdateCallback: (nodeId: string, newText: string) => void
  ) {
    console.log('Starting text edit for node:', d.id);
    currentlyEditingNodeId = d.id;

    // Hide original text elements
    originalTextElements.forEach(el => el.style('display', 'none'));

    // Calculate position and size for the input
    let firstLineY = d.size / 2 + 6;
    const approxInputHeight = 20;
    const inputWidth = 100;

    // Create foreignObject
    const foreignObject = nodeGroup.append('foreignObject')
      .attr('class', 'node-text-editor-fo')
      .attr('x', -inputWidth / 2)
      .attr('y', firstLineY - 2)
      .attr('width', inputWidth)
      .attr('height', approxInputHeight)
      .style('overflow', 'visible');

    // Create HTML input inside foreignObject with improved styling
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
      .style('color', 'rgba(0, 0, 0, 0.8)') // Add text color to match the text elements
      .style('background-color', 'rgba(255, 255, 255, 0.95)') // Slightly transparent white
      .node() as HTMLInputElement;

    activeInput = input;

    // Focus and select text
    input.focus();
    input.select();

    // Add event listeners
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        saveTextEdit(d.id, input.value, foreignObject, originalTextElements, textUpdateCallback);
      } else if (e.key === 'Escape') {
        cancelTextEdit(foreignObject, originalTextElements);
      }
    });

    input.addEventListener('blur', () => {
      if (currentlyEditingNodeId === d.id) {
        cancelTextEdit(foreignObject, originalTextElements);
      }
    });
  }

  function saveTextEdit(
    nodeId: string, 
    newValue: string, 
    foreignObject: Selection<any, GraphNode, any, any>,
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[],
    textUpdateCallback: (nodeId: string, newText: string) => void
  ) {
    console.log(`Saving text for ${nodeId}: ${newValue}`);
    
    // Prevent race condition with blur event
    if (isCleaningUp) {
      console.log('Already cleaning up, skipping save');
      return;
    }
    
    // Set flag to prevent multiple cleanups
    isCleaningUp = true;
    
    // Call the callback before cleanup
    textUpdateCallback(nodeId, newValue);
    
    // Use try/catch to handle any DOM removal errors
    try {
      cleanupEdit(foreignObject, originalTextElements);
    } catch (error) {
      console.warn('Error during edit cleanup:', error);
      // Reset editing state even if cleanup fails
      currentlyEditingNodeId = null;
      activeInput = null;
    } finally {
      // Reset cleanup flag when done
      isCleaningUp = false;
    }
  }

  function cancelTextEdit(
    foreignObject: Selection<any, GraphNode, any, any>,
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[]
  ) {
    console.log(`Cancelling text edit for ${currentlyEditingNodeId}`);
    
    // Skip if already cleaning up from save
    if (isCleaningUp) {
      console.log('Already cleaning up, skipping cancel');
      return;
    }
    
    isCleaningUp = true;
    
    try {
      cleanupEdit(foreignObject, originalTextElements);
    } catch (error) {
      console.warn('Error during edit cleanup:', error);
      // Reset editing state even if cleanup fails
      currentlyEditingNodeId = null;
      activeInput = null;
    } finally {
      isCleaningUp = false;
    }
  }
  
  function cleanupEdit(
    foreignObject: Selection<any, any, any, any>,
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
    createNodeGradients
  };
} 