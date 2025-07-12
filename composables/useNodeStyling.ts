import type { Selection } from 'd3'
import type { GraphNode } from '~/types/graph'
import * as d3 from 'd3'

// Helper to check if currently editing
let currentlyEditingNodeId: string | null = null
let _activeInput: HTMLInputElement | null = null
// Track if we've initialized the event handlers
// let eventHandlersInitialized = false; // No longer needed here

// Add a cleanup flag to prevent double-removal
let isCleaningUp = false

export function useNodeStyling() {
  /**
   * Maps zone names to their gradient colors
   */
  const zoneGradients = {
    Subject: {
      light: '#A38BFE', // Lighter lavender
      main: '#A38BFE', // Main lavender
      dark: '#65F0D5', // Mint accent
    },
    Attributes: {
      light: '#FF8AE2', // Lighter pink
      main: '#FF8AE2', // Main pink
      dark: '#FFC46B', // Gold accent
    },
    Activity: {
      light: '#84FFF5', // Lighter cyan
      main: '#84FFF5', // Main cyan
      dark: '#4C6EF5', // Indigo accent
    },
    Composition: {
      light: '#F6D365', // Lighter yellow
      main: '#F6D365', // Main yellow
      dark: '#FDA085', // Peach accent
    },
    Aesthetics: {
      light: '#C2FFD8', // Lighter mint
      main: '#C2FFD8', // Main mint
      dark: '#465EFB', // Blue accent
    },
    Mood: {
      light: '#F9D423', // Lighter gold
      main: '#F9D423', // Main gold
      dark: '#FF4E50', // Red accent
    },
    Setting: {
      light: '#9EAAFF', // Lighter indigo
      main: '#667EEA', // Main indigo
      dark: '#764BA2', // Purple accent
    },
    Layout: {
      light: '#FFD870', // Lighter gold
      main: '#FFD870', // Main gold
      dark: '#E5B845', // Peach accent
    },
  }

  // Default gradient for fallback
  const defaultGradient = {
    light: '#9B9DFF',
    main: '#6366f1',
    dark: '#8B5CF6',
  }

  /**
   * Creates node gradient definitions in the SVG
   */
  const createNodeGradients = (svg: Selection<SVGSVGElement, unknown, null, undefined>) => {
    // First check if we already have defs
    if (svg.select('defs').empty()) {
      svg.append('defs')
    }

    const defs = svg.select('defs')

    // Create gradients for each zone
    Object.entries(zoneGradients).forEach(([zone, colors]) => {
      const gradientId = `node-gradient-${zone.toLowerCase()}`

      // Only create if it doesn't exist yet
      if (defs.select(`#${gradientId}`).empty()) {
        // Create a radial gradient for sphere-like effect
        const gradient = defs
          .append('radialGradient')
          .attr('id', gradientId)
          .attr('cx', '30%') // Move highlight more to the top-left
          .attr('cy', '30%')
          .attr('r', '80%') // Cover more of the circle
          .attr('fx', '7%') // Focus highlight in top-left corner
          .attr('fy', '7%')

        // Start with a lighter version of the main color at center
        gradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', colors.light) // Lighter shade
          .attr('stop-opacity', '1')

        // Transition to main color
        gradient
          .append('stop')
          .attr('offset', '30%')
          .attr('stop-color', colors.main) // Main color
          .attr('stop-opacity', '1')

        // Transition to darker end color
        gradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', colors.dark) // Darker accent color
          .attr('stop-opacity', '0.9')

        // Add glow filter for selected nodes
        if (defs.select(`#glow-${zone.toLowerCase()}`).empty()) {
          const filter = defs
            .append('filter')
            .attr('id', `glow-${zone.toLowerCase()}`)
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%')

          // Add stronger blur effect for selected nodes
          filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')

          // Combine original with blur
          filter
            .append('feComposite')
            .attr('in', 'SourceGraphic')
            .attr('in2', 'blur')
            .attr('operator', 'over')
        }
      }
    })

    // Create default gradient
    if (defs.select('#node-gradient-default').empty()) {
      const gradient = defs
        .append('radialGradient')
        .attr('id', 'node-gradient-default')
        .attr('cx', '30%')
        .attr('cy', '30%')
        .attr('r', '80%')
        .attr('fx', '15%')
        .attr('fy', '15%')

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', defaultGradient.light)
        .attr('stop-opacity', '1')

      gradient
        .append('stop')
        .attr('offset', '30%')
        .attr('stop-color', defaultGradient.main)
        .attr('stop-opacity', '1')

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', defaultGradient.dark)
        .attr('stop-opacity', '0.9')

      // Add default glow
      if (defs.select('#glow-default').empty()) {
        const filter = defs
          .append('filter')
          .attr('id', 'glow-default')
          .attr('x', '-50%')
          .attr('y', '-50%')
          .attr('width', '200%')
          .attr('height', '200%')

        filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur')

        filter
          .append('feComposite')
          .attr('in', 'SourceGraphic')
          .attr('in2', 'blur')
          .attr('operator', 'over')
      }
    }

    // Create loading animation filter
    if (defs.select('#loading-pulse').empty()) {
      const filter = defs
        .append('filter')
        .attr('id', 'loading-pulse')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%')

      // Create pulsing effect with feGaussianBlur
      const blur = filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'blur')

      // Add animation to the blur
      blur
        .append('animate')
        .attr('attributeName', 'stdDeviation')
        .attr('values', '2;4;2')
        .attr('dur', '1.5s')
        .attr('repeatCount', 'indefinite')

      filter
        .append('feComposite')
        .attr('in', 'SourceGraphic')
        .attr('in2', 'blur')
        .attr('operator', 'over')
    }
  }

  /**
   * Gets the fill color for a node based on its state
   */
  const getNodeGradient = (node: GraphNode): string => {
    // Loading state - use a subtle pulsing effect
    if (node.isLoading) {
      return 'rgba(255, 255, 255, 0.4)'
    }

    // Unselected nodes - solid custom color
    if (!node.selected) {
      return '#565571'
    }

    // Selected nodes - full gradient based on zone
    const zone = node.zone || 'default'
    const normalizedZone =
      Object.keys(zoneGradients).find((z) => z.toLowerCase() === zone.toLowerCase()) || 'default'

    return `url(#node-gradient-${normalizedZone.toLowerCase()})`
  }

  /**
   * Gets the appropriate glow filter for a node based on its state
   */
  const getNodeGlowFilter = (node: GraphNode): string | null => {
    // Loading state - use pulsing animation
    if (node.isLoading) {
      return 'url(#loading-pulse)'
    }

    // Selected nodes get zone-specific glow
    if (node.selected) {
      const zone = node.zone || 'default'
      const normalizedZone =
        Object.keys(zoneGradients).find((z) => z.toLowerCase() === zone.toLowerCase()) || 'default'

      return `url(#glow-${normalizedZone.toLowerCase()})`
    }

    return null
  }

  /**
   * Applies styling to EXISTING graph node elements (circle, text).
   * Does NOT create or remove elements.
   */
  const applyNodeStyle = (
    selection: Selection<any, GraphNode, any, any>,
    isHover = false,
    // svg is needed for createNodeGradients if called, but applyNodeStyle itself won't use it directly for DOM manipulation
    _svg?: Selection<any, unknown, null, undefined> | null
    // textUpdateCallback is removed as this function no longer manages text element creation or their listeners
  ) => {
    // createNodeGradients might still be relevant if called before any styling relies on new gradients
    // However, its placement might be better in the main manageNodeVisualsAndText function before any node processing.
    // For now, let's assume it's called appropriately elsewhere or ensure it's idempotent.
    // if (svg) {
    //   createNodeGradients(svg);
    // }

    selection
      .select('.node-circle') // Assumes .node-circle exists
      .attr('fill', (d) => getNodeGradient(d))
      .attr('filter', (d) => {
        if (d.isLoading || d.selected) {
          return getNodeGlowFilter(d)
        }
        return isHover ? 'url(#glow-default)' : null
      })
      .attr('stroke', (d) => {
        if (d.isLoading) return 'rgba(255, 255, 255, 0.8)'
        if (d.selected) return '#fff'
        return isHover ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.3)'
      })
      .attr('stroke-width', (d) => {
        if (d.isLoading) return 2
        if (d.selected) return 2
        return isHover ? 2 : 1
      })
      .attr('r', (d) => {
        const baseRadius = d.size / 2
        if (d.isLoading) return baseRadius * 1.05
        // Selected state radius changes are often handled by a transition in ForceGraph.vue or a general 'selected' class style
        // For hover, a slight increase is fine.
        if (isHover && !d.selected) return baseRadius * 1.03
        return baseRadius
      })
      .style('opacity', (d) => {
        if (d.isLoading) return 0.8
        return 1
      })
      .style('transition', 'all 0.2s ease') // Keep transitions for smoothness

    // REMOVE all text element creation/deletion and foreignObject logic from here.
    // We assume .node-text elements are managed (created/updated/removed) by another function (manageNodeVisualsAndText).

    selection.each(function (d) {
      // `d` is GraphNode data bound to the group element
      const nodeGroup = d3.select(this)

      // Update styles of EXISTING text elements.
      nodeGroup
        .selectAll('.node-text') // Assumes .node-text elements exist if there's text
        .attr('font-size', d.selected ? '11px' : '10px')
        .attr('fill', (_textData: unknown) => {
          // textData here is the line string, but d (GraphNode) is in closure
          if (d.isLoading) return 'rgba(255, 255, 255, 0.6)'
          if (d.selected) return 'rgba(255, 255, 255, 0.95)'
          return 'rgba(255, 255, 255, 0.8)'
        })
        .attr('font-weight', (_textData: unknown) => {
          if (d.selected) return '700'
          if (d.isLoading) return '500' // Less emphasis for loading text vs selected
          return '500'
        })
        .attr('text-shadow', (_textData: unknown) => {
          if (d.selected) return '0 0 6px rgba(255, 255, 255, 0.9)'
          return '0 0 4px rgba(255, 255, 255, 0.7)'
        })
      // DO NOT attach click listeners here.

      // Loading indicator: manageNodeVisualsAndText will create/remove it.
      // applyNodeStyle can be responsible for toggling its *visibility* if the element exists,
      // or changing its animation state, but this might also be simpler in manageNodeVisualsAndText.
      // For now, let's assume manageNodeVisualsAndText handles the spinner's presence entirely.
      // nodeGroup.select('.loading-indicator').style('display', d.isLoading ? 'block' : 'none');
    })

    // No longer raising here, ForceGraph.vue or manageNodeVisualsAndText can handle raising selected/hovered nodes.
    // if (selection.data().length > 0 && selection.data()[0]?.selected) {
    //   selection.raise();
    // }
  }

  function startTextEdit(
    _event: any,
    d: GraphNode,
    nodeElement: SVGGElement,
    textElementsToHide: d3.Selection<SVGTextElement, unknown, any, any>[],
    textUpdateCallback: (nodeId: string, newText: string) => void
  ) {
    if (currentlyEditingNodeId || isCleaningUp) return
    currentlyEditingNodeId = d.id
    let isEditorActive = true
    textElementsToHide.forEach((el) => el.style('display', 'none'))

    const inputHeight = 20
    const inputBaseWidth = 80
    const buttonWidth = 20
    const totalButtonsWidth = buttonWidth * 2
    const totalFOWidth = inputBaseWidth + totalButtonsWidth
    const firstLineY = d.size / 2 + 6

    const foreignObjectSelection = d3
      .select(nodeElement)
      .append('foreignObject')
      .attr('class', 'node-text-editor-fo')
      .attr('x', -totalFOWidth / 2)
      .attr('y', firstLineY - 2)
      .attr('width', totalFOWidth)
      .attr('height', inputHeight)
      .style('overflow', 'visible')

    const editorContainer = foreignObjectSelection
      .append('xhtml:div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('width', '100%')
      .style('height', '100%')

    const cancelButton = editorContainer
      .append('xhtml:button')
      .attr('class', 'p-button p-button-text p-button-icon-only node-edit-button cancel-button')
      .style('width', `${buttonWidth}px`)
      .style('height', `${inputHeight}px`)
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('padding', '0')
      .style('border', '1px solid #F44336')
      .style('background-color', 'rgba(244, 67, 54, 0.1)')
      .style('color', '#F44336')
      .style('cursor', 'pointer')
      .style('border-radius', '3px 0 0 3px')
      .html('<i class="pi pi-times" style="font-size: 12px;"></i>')
    cancelButton.on('click', (event: MouseEvent) => {
      event.stopPropagation()
      cancelTextEdit(foreignObjectSelection, textElementsToHide)
    })

    const input = editorContainer
      .append('xhtml:input')
      .attr('type', 'text')
      .attr('value', d.text)
      .style('width', `${inputBaseWidth}px`)
      .style('height', `${inputHeight}px`)
      .style('font-size', '10px')
      .style('text-align', 'center')
      .style('border', '1px solid #ccc')
      .style('border-left', 'none')
      .style('border-right', 'none')
      .style('border-radius', '0')
      .style('padding', '1px 3px')
      .style('box-shadow', '0 1px 3px rgba(0,0,0,0.1)')
      .style('color', 'rgba(0, 0, 0, 0.8)')
      .style('background-color', 'rgba(255, 255, 255, 0.95)')
      .style('margin-left', '-1px')
      .style('margin-right', '-1px')
      .style('outline', 'none')
      .node() as HTMLInputElement
    _activeInput = input
    input.focus()
    input.select()

    const saveButton = editorContainer
      .append('xhtml:button')
      .attr('class', 'p-button p-button-text p-button-icon-only node-edit-button save-button')
      .style('width', `${buttonWidth}px`)
      .style('height', `${inputHeight}px`)
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('justify-content', 'center')
      .style('padding', '0')
      .style('border', '1px solid #4CAF50')
      .style('background-color', 'rgba(76, 175, 80, 0.1)')
      .style('color', '#4CAF50')
      .style('cursor', 'pointer')
      .style('border-radius', '0 3px 3px 0')
      .html('<i class="pi pi-check" style="font-size: 12px;"></i>')
    saveButton.on('click', (event: MouseEvent) => {
      event.stopPropagation()
      saveTextEdit(
        d.id,
        input.value,
        foreignObjectSelection,
        textElementsToHide,
        textUpdateCallback
      )
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        saveTextEdit(
          d.id,
          input.value,
          foreignObjectSelection,
          textElementsToHide,
          textUpdateCallback
        )
      } else if (e.key === 'Escape') {
        cancelTextEdit(foreignObjectSelection, textElementsToHide)
      }
    }

    input.addEventListener('keydown', handleKeyDown)
    const currentInputRef = input

    const instanceDocumentClickHandler = (clickEvent: MouseEvent) => {
      if (!isEditorActive) {
        return
      }
      if (isCleaningUp) {
        return
      }
      const foElement = foreignObjectSelection.node()
      if (!foElement) {
        return
      }
      const isTargetOutsideFO = !foElement.contains(clickEvent.target as Node)
      const isTargetNotSaveButton =
        clickEvent.target !== saveButton.node() &&
        !(saveButton.node() as HTMLElement).contains(clickEvent.target as Node)
      const isTargetNotCancelButton =
        clickEvent.target !== cancelButton.node() &&
        !(cancelButton.node() as HTMLElement).contains(clickEvent.target as Node)
      if (isTargetOutsideFO && isTargetNotSaveButton && isTargetNotCancelButton) {
        cancelTextEdit(foreignObjectSelection, textElementsToHide)
      }
    }

    document.addEventListener('click', instanceDocumentClickHandler, true)
    ;(input as any).__cleanupListeners = () => {
      isEditorActive = false
      currentInputRef.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', instanceDocumentClickHandler, true)
    }
  }

  function saveTextEdit(
    nodeId: string,
    newValue: string,
    foreignObject: Selection<any, unknown, null, undefined>,
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[],
    textUpdateCallback: (nodeId: string, newText: string) => void
  ) {
    if (isCleaningUp) return
    isCleaningUp = true
    textUpdateCallback(nodeId, newValue)
    try {
      cleanupEdit(foreignObject, originalTextElements)
    } catch (error) {
      currentlyEditingNodeId = null // Ensure reset even on error
      _activeInput = null
    } finally {
      isCleaningUp = false
    }
  }

  function cancelTextEdit(
    foreignObject: Selection<any, unknown, null, undefined>,
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[]
  ) {
    const nodeIdForLog = currentlyEditingNodeId // Capture before potential reset
    if (isCleaningUp) return
    isCleaningUp = true
    try {
      cleanupEdit(foreignObject, originalTextElements)
    } catch (error) {
      currentlyEditingNodeId = null // Ensure reset even on error
      _activeInput = null
    } finally {
      isCleaningUp = false
    }
  }

  function cleanupEdit(
    foreignObject: Selection<any, unknown, null, undefined>,
    originalTextElements: d3.Selection<SVGTextElement, unknown, any, any>[]
  ) {
    const activeNodeIdForLog = currentlyEditingNodeId // Capture for logging
    if (!foreignObject.empty()) {
      const inputEl = foreignObject.select('input').node() as HTMLInputElement | null
      if (inputEl && (inputEl as any).__cleanupListeners) {
        ;(inputEl as any).__cleanupListeners()
        delete (inputEl as any).__cleanupListeners
      }
      try {
        foreignObject.remove()
      } catch (error) {
        console.warn('Error removing foreignObject:', error)
      }
    }
    try {
      originalTextElements.forEach((el) => el.style('display', null))
    } catch (error) {
      console.warn('Error restoring text elements:', error)
    }
    currentlyEditingNodeId = null
    _activeInput = null
  }

  /**
   * Gets the image path for a subject node
   */
  const getSubjectImagePath = (text: string): string => {
    // Map the node text to the correct filename
    const nodeTextToFilename: Record<string, string> = {
      Humans: 'humans',
      Animals: 'animals',
      'Mythical Creatures': 'mythical-creatures',
      Plants: 'plants',
      Objects: 'objects',
      'Abstract Concepts': 'abstract-concepts',
      Structures: 'structures',
      Landscapes: 'landscapes',
    }

    const filename = nodeTextToFilename[text] || text.toLowerCase().replace(/\s+/g, '-')
    // Use dynamic imports of assets instead of hard-coded paths
    return new URL(`/assets/pics/subject/${filename}.png`, import.meta.url).href
  }

  // Helper function to format text, keep this as it's used by ForceGraph.vue's nodeEnter
  const formatNodeText = (text: string): string[] => {
    const words = text.split(' ')
    if (words.length <= 1) return [text]
    if (words.length === 2) return words
    if (words.length === 3) return [words[0], `${words[1]} ${words[2]}`]
    const firstLineCount = Math.ceil(words.length / 2)
    return [words.slice(0, firstLineCount).join(' '), words.slice(firstLineCount).join(' ')]
  }

  // This will be the new primary function, to be implemented in the next task.
  const manageNodeVisualsAndText = (
    selection: d3.Selection<SVGGElement, GraphNode, any, any>,
    isEnter: boolean,
    callbacks: { updateTextForNode: (nodeId: string, newText: string) => void },
    isHover: boolean,
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    globallyCurrentlyEditingNodeId: string | null
  ) => {
    currentlyEditingNodeId = globallyCurrentlyEditingNodeId

    if (isEnter) {
      selection.each(function (nodeData) {
        const nodeGroup = d3.select(this)
        createNodeGradients(svg) // Ensure gradients defined

        nodeGroup
          .append('circle')
          .attr('class', 'node-circle')
          .attr('r', nodeData.size / 2)

        if (nodeData.imageUrl) {
          nodeGroup
            .append('image')
            .attr('class', 'tag-node-image')
            .attr('xlink:href', nodeData.imageUrl)
            .attr('x', -nodeData.size / 2)
            .attr('y', -nodeData.size / 2)
            .attr('width', nodeData.size)
            .attr('height', nodeData.size)
            .attr('clip-path', `circle(${nodeData.size / 2}px at center)`)
            .on('error', function () {
              // Handle broken image links by hiding the image
              d3.select(this).style('display', 'none')
            })
        } else if (nodeData.zone === 'Subject' && !nodeData.parentId) {
          nodeGroup
            .append('image')
            .attr('xlink:href', getSubjectImagePath(nodeData.text))
            .attr('x', -nodeData.size / 2)
            .attr('y', -nodeData.size / 2)
            .attr('width', nodeData.size)
            .attr('height', nodeData.size)
            .attr('class', 'subject-node-image')
            .on('error', function () {
              // Handle broken image links
              d3.select(this).style('display', 'none')
            })
        } else {
          const textLines = formatNodeText(nodeData.text)
          const textElementsForThisNode: d3.Selection<SVGTextElement, unknown, any, any>[] = []
          textLines.forEach((line, i) => {
            const yPos = nodeData.size / 2 + 8 + i * 14
            const textElement = nodeGroup
              .append('text')
              .attr('class', 'node-text')
              .attr('x', 0)
              .attr('y', yPos)
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'hanging')
              .attr('font-size', '10px') // Initial, applyNodeStyle might change based on selection
              .attr('fill', 'rgba(255, 255, 255, 0.8)')
              .attr('font-weight', '500')
              .attr('text-shadow', '0 0 4px rgba(255, 255, 255, 0.7)')
              .style('cursor', nodeData.isLoading ? 'default' : 'text')
              .style('pointer-events', nodeData.isLoading ? 'none' : 'auto')
              .style('user-select', 'none')
              .style('paint-order', 'stroke fill')
              .style('stroke', 'transparent') // For invisible clickable area
              .style('stroke-width', '6px') // For invisible clickable area
              .attr('data-node-id', nodeData.id)
              .text(line)
            textElementsForThisNode.push(textElement)
            if (!nodeData.isLoading) {
              textElement.on('click.textEdit', function (event) {
                event.stopPropagation()
                startTextEdit(
                  event,
                  nodeData,
                  nodeGroup.node() as SVGGElement,
                  textElementsForThisNode,
                  callbacks.updateTextForNode
                )
              })
            }
          })
        }

        if (nodeData.isLoading) {
          const spinnerGroup = nodeGroup
            .append('g')
            .attr('class', 'loading-indicator')
            .attr('transform', `translate(0, 0)`)
          spinnerGroup
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 18)
            .attr('fill', 'rgba(255,255,255,0.1)')
            .attr('stroke', 'none')
          const spinnerRadius = 13,
            strokeWidth = 2
          const spinner = spinnerGroup
            .append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', spinnerRadius)
            .attr('fill', 'none')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', strokeWidth)
            .attr('stroke-linecap', 'round')
            .attr(
              'stroke-dasharray',
              `${spinnerRadius * 2 * Math.PI * 0.25} ${spinnerRadius * 2 * Math.PI * 0.75}`
            )
            .attr('transform-origin', '0 0')
          spinner
            .append('animateTransform')
            .attr('attributeName', 'transform')
            .attr('attributeType', 'XML')
            .attr('type', 'rotate')
            .attr('from', '0 0 0')
            .attr('to', '360 0 0')
            .attr('dur', '1s')
            .attr('repeatCount', 'indefinite')
        } else {
          nodeGroup.select('.loading-indicator').remove()
        }
      })
    } else {
      // Update logic (isEnter === false)
      selection.each(function (nodeData) {
        const nodeGroup = d3.select(this)

        // Manage dynamic tag image
        const tagImage = nodeGroup.select('.tag-node-image')
        if (nodeData.imageUrl) {
          nodeGroup.selectAll('.node-text, .subject-node-image').remove() // Remove text/subject image if we have a tag image
          if (tagImage.empty()) {
            nodeGroup
              .append('image')
              .attr('class', 'tag-node-image')
              .attr('xlink:href', nodeData.imageUrl)
              .attr('x', -nodeData.size / 2)
              .attr('y', -nodeData.size / 2)
              .attr('width', nodeData.size)
              .attr('height', nodeData.size)
              .attr('clip-path', `circle(${nodeData.size / 2}px at center)`)
              .on('error', function () {
                d3.select(this).style('display', 'none')
              })
          } else {
            tagImage.attr('xlink:href', nodeData.imageUrl).style('display', null) // Update existing
          }
        } else {
          tagImage.remove() // Remove tag image if no longer present in data
        }

        // 2. Manage Loading Indicator
        if (nodeData.isLoading) {
          if (nodeGroup.select('.loading-indicator').empty()) {
            // Append loading indicator if it doesn't exist (e.g., node started loading after initial render)
            const spinnerGroup = nodeGroup
              .append('g')
              .attr('class', 'loading-indicator')
              .attr('transform', `translate(0, 0)`)
            spinnerGroup
              .append('circle')
              .attr('cx', 0)
              .attr('cy', 0)
              .attr('r', 18)
              .attr('fill', 'rgba(255,255,255,0.1)')
              .attr('stroke', 'none')
            const spinnerRadius = 13,
              strokeWidth = 2
            const spinner = spinnerGroup
              .append('circle')
              .attr('cx', 0)
              .attr('cy', 0)
              .attr('r', spinnerRadius)
              .attr('fill', 'none')
              .attr('stroke', '#ffffff')
              .attr('stroke-width', strokeWidth)
              .attr('stroke-linecap', 'round')
              .attr(
                'stroke-dasharray',
                `${spinnerRadius * 2 * Math.PI * 0.25} ${spinnerRadius * 2 * Math.PI * 0.75}`
              )
              .attr('transform-origin', '0 0')
            spinner
              .append('animateTransform')
              .attr('attributeName', 'transform')
              .attr('attributeType', 'XML')
              .attr('type', 'rotate')
              .attr('from', '0 0 0')
              .attr('to', '360 0 0')
              .attr('dur', '1s')
              .attr('repeatCount', 'indefinite')
          }
        } else {
          nodeGroup.select('.loading-indicator').remove() // Remove if not loading
        }

        // 3. Handle Text Updates
        // Avoid re-rendering text if node is currently being edited to prevent editor removal
        if (currentlyEditingNodeId !== nodeData.id && !nodeData.imageUrl) {
          const newTextLines = formatNodeText(nodeData.text)
          const textElementsJoin = nodeGroup
            .selectAll<SVGTextElement, string>('.node-text') // Specify types for clarity
            .data(newTextLines)

          // 3a. Exit: Remove old text lines
          textElementsJoin.exit().remove()

          // 3b. Enter: Add new text lines (replicating full creation logic from isEnter path)
          const textElementsEntered = textElementsJoin
            .enter()
            .append('text')
            .attr('class', 'node-text')
            .attr('x', 0)
            // Calculate Y position carefully for new lines among existing/removed ones
            .attr('y', (line, i) => {
              // This needs to be robust: find the intended index in the newTextLines array
              // and calculate yPos based on that, not just a simple `i` from the enter selection.
              // For simplicity, we'll use the index `i` relative to the `newTextLines` array for now.
              // A more robust way would be to use the index of `line` in `newTextLines`.
              const lineIndex = newTextLines.indexOf(line)
              return nodeData.size / 2 + 8 + lineIndex * 14
            })
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'hanging')
            .attr('font-size', '10px') // Initial, applyNodeStyle will adjust if selected
            .attr('fill', 'rgba(255, 255, 255, 0.8)')
            .attr('font-weight', '500')
            .attr('text-shadow', '0 0 4px rgba(255, 255, 255, 0.7)')
            .style('cursor', nodeData.isLoading ? 'default' : 'text')
            .style('pointer-events', nodeData.isLoading ? 'none' : 'auto')
            .style('user-select', 'none')
            .style('paint-order', 'stroke fill')
            .style('stroke', 'transparent')
            .style('stroke-width', '6px')
            .attr('data-node-id', nodeData.id)
            .text((line) => line)

          // Attach click listener to newly entered text elements
          textElementsEntered.each(function (lineData) {
            // `this` is the textElement
            if (!nodeData.isLoading) {
              d3.select(this).on('click.textEdit', function (event) {
                event.stopPropagation()
                // Collect all current text elements for this node to pass to startTextEdit
                const allTextElementsForNode = nodeGroup
                  .selectAll<SVGTextElement, unknown>('.node-text')
                  .nodes()
                  .map((el) => d3.select(el))
                startTextEdit(
                  event,
                  nodeData,
                  nodeGroup.node() as SVGGElement,
                  allTextElementsForNode,
                  callbacks.updateTextForNode
                )
              })
            }
          })

          // 3c. Update: Update text content for existing, non-exiting elements
          textElementsJoin.text((line) => line) // Update text for elements that were already there
        }
      })
    }

    // Call applyNodeStyle at the end to apply styles to all elements (newly created or existing)
    // based on the current nodeData (e.g. selection, hover) and isHover state.
    applyNodeStyle(selection, isHover, svg)
  }

  return {
    getSubjectImagePath,
    createNodeGradients,
    startTextEdit,
    formatNodeText,
    manageNodeVisualsAndText,
    getNodeGradient,
    getNodeGlowFilter,
  }
}
