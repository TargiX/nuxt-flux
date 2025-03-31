import { ref } from 'vue';
import * as d3 from 'd3';

export function useZoom() {
  const zoomBehavior = ref<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const currentTransform = ref<d3.ZoomTransform>(d3.zoomIdentity);

  function initializeZoom(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, g: d3.Selection<SVGGElement, unknown, null, undefined>) {
    // Initialize zoom behavior
    zoomBehavior.value = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4]) // Set min/max zoom scale
      .on('zoom', (event) => {
        currentTransform.value = event.transform;
        g.attr('transform', event.transform.toString());
      });

    // Apply zoom behavior to SVG
    svg.call(zoomBehavior.value as any)
      .call(zoomBehavior.value.transform as any, d3.zoomIdentity);
  }

  function centerOnNode(
    svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
    node: { x?: number; y?: number },
    width: number,
    height: number
  ) {
    if (!zoomBehavior.value || !svg.node() || !node.x || !node.y) return;

    // Get current transform state
    const currentTransform = d3.zoomTransform(svg.node()!);
    const scale = currentTransform.k;

    // Calculate center point
    const centerX = width / 2;
    const centerY = height / 2;

    // Calculate the new transform
    const newTransform = d3.zoomIdentity
      .translate(centerX - node.x * scale, centerY - node.y * scale)
      .scale(scale);

    // Apply smooth transition
    svg.transition()
      .duration(750)
      .call(zoomBehavior.value.transform as any, newTransform);
  }

  function zoomIn(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    if (!zoomBehavior.value) return;
    svg.transition()
      .duration(300)
      .call(zoomBehavior.value.scaleBy as any, 1.5);
  }

  function zoomOut(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    if (!zoomBehavior.value) return;
    svg.transition()
      .duration(300)
      .call(zoomBehavior.value.scaleBy as any, 0.75);
  }

  function resetZoom(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
    if (!zoomBehavior.value) return;
    svg.transition()
      .duration(300)
      .call(zoomBehavior.value.transform as any, d3.zoomIdentity);
  }

  return {
    zoomBehavior,
    currentTransform,
    initializeZoom,
    centerOnNode,
    zoomIn,
    zoomOut,
    resetZoom
  };
} 