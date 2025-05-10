import { ref } from 'vue';
import * as d3 from 'd3';

export interface ViewportState {
  x: number;
  y: number;
  k: number;
}

export function useZoom() {
  const zoomBehavior = ref<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  let initialZoomScale = 1.4;
  let currentSvgWidth = 0;
  let currentSvgHeight = 0;

  function initializeZoom(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    width: number,
    height: number,
    defaultScale: number = 1.4
  ) {
    initialZoomScale = defaultScale;
    currentSvgWidth = width;
    currentSvgHeight = height;

    zoomBehavior.value = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoomBehavior.value);
    // Initial transform (like centering) is typically handled by the component calling initializeZoom
  }
  
  // Function to get the current viewport state
  function getCurrentViewport(svgSelection: d3.Selection<SVGSVGElement, unknown, null, undefined> | null): ViewportState | null {
    if (!svgSelection || !svgSelection.node()) {
      return null;
    }
    const transform = d3.zoomTransform(svgSelection.node()!);
    return { x: transform.x, y: transform.y, k: transform.k };
  }

  // Function to apply a specific viewport state or reset to default
  function applyViewport(
    svgSelection: d3.Selection<SVGSVGElement, unknown, null, undefined> | null,
    targetViewport?: ViewportState,
    duration: number = 750
  ) {
    if (!svgSelection || !zoomBehavior.value || currentSvgWidth === 0 || currentSvgHeight === 0) {
      // Ensure dimensions are known for default reset
      return;
    }

    let finalTransform: d3.ZoomTransform;

    if (targetViewport) {
      finalTransform = d3.zoomIdentity.translate(targetViewport.x, targetViewport.y).scale(targetViewport.k);
    } else {
      // Default/Reset logic: center and apply initial scale
      const centerX = currentSvgWidth / 2;
      const centerY = currentSvgHeight / 2;
      // This default transform aims to center the content origin (0,0) in the view, then scale.
      // Adjust if your content's natural center is different.
      finalTransform = d3.zoomIdentity
        .translate(centerX, centerY) // Move viewport center to SVG 0,0
        .scale(initialZoomScale)    // Apply initial scale
        .translate(-centerX / initialZoomScale, -centerY / initialZoomScale); // Adjust for content center after scale - needs refinement if nodes start elsewhere
      // A simpler default might be just: d3.zoomIdentity.translate(centerX, centerY).scale(initialZoomScale);
      // And then the graph itself ensures nodes are positioned relative to this. Let's use the simpler one first.
      finalTransform = d3.zoomIdentity.translate(centerX, centerY).scale(initialZoomScale).translate(-centerX, -centerY);
    }

    svgSelection.transition().duration(duration)
      .call(zoomBehavior.value.transform as any, finalTransform);
  }


  function zoomIn(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    if (zoomBehavior.value) {
      svg.transition().duration(350).call(zoomBehavior.value.scaleBy, 1.3);
    }
  }

  function zoomOut(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    if (zoomBehavior.value) {
      svg.transition().duration(350).call(zoomBehavior.value.scaleBy, 1 / 1.3);
    }
  }

  function resetZoom(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    // This function will now use applyViewport with no targetViewport
    applyViewport(svg, undefined, 750);
  }
  
  function centerOnNode(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    node: { x?: number | null; y?: number | null },
    // width and height of the SVG drawing area are needed here, assume they are currentSvgWidth/Height
  ) {
    if (!zoomBehavior.value || node.x == null || node.y == null || !svg.node()) return;
    
    const currentK = d3.zoomTransform(svg.node()!).k; // Get current scale for smoother centering
    const targetScale = Math.max(currentK, initialZoomScale); // Center at least at initialZoomScale or current if more zoomed in

    const transform = d3.zoomIdentity
      .translate(currentSvgWidth / 2, currentSvgHeight / 2) // Translate origin to center of viewport
      .scale(targetScale) // Apply scale
      .translate(-node.x, -node.y); // Translate so node.x, node.y is at the origin

    svg.transition().duration(750).call(zoomBehavior.value.transform as any, transform);
  }

  // Function to completely reset the zoom transform to identity with optional duration
  function hardReset(
    svgSelection: d3.Selection<SVGSVGElement, unknown, null, undefined> | null,
    duration: number = 0
  ) {
    if (!svgSelection || !zoomBehavior.value || !svgSelection.node()) {
      return;
    }
    
    // Reset to identity transform (no translation, no scale)
    const identityTransform = d3.zoomIdentity;
    
    if (duration > 0) {
      svgSelection.transition().duration(duration)
        .call(zoomBehavior.value.transform as any, identityTransform);
    } else {
      svgSelection.call(zoomBehavior.value.transform as any, identityTransform);
    }
  }

  return {
    initializeZoom,
    zoomIn,
    zoomOut,
    resetZoom, 
    hardReset, // Add the new hard reset function
    centerOnNode,
    getCurrentViewport,
    applyViewport,
    // zoomBehavior, // Keeping this unexposed unless a strong need arises
  };
} 