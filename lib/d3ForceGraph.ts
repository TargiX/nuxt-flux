// lib/d3ForceGraph.ts
import * as d3 from 'd3';
import type { Tag } from '~/store/tagStore'; // Import your Tag type

interface GraphOptions {
  width: number;
  height: number;
  onNodeClick: (event: MouseEvent, node: Tag) => void;
  onPositionsUpdated?: (nodes: Tag[]) => void; // Callback for position updates
}

export class D3ForceGraph {
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private simulation: d3.Simulation<Tag, d3.SimulationLinkDatum<Tag>>;
  private options: GraphOptions;

  constructor(container: HTMLElement, options: GraphOptions) {
    this.options = options;

      this.svg = d3.select(container)
      .append('svg')
      .attr('width', options.width)
      .attr('height', options.height)
      .attr('viewBox', [0, 0, options.width, options.height])
      .attr('style', 'width: 100%; height: 100%;');

    // Background rect for click handling (optional, but good practice)
    this.svg.append('rect')
      .attr('width', options.width)
      .attr('height', options.height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

      this.svg = this.svg.append("g");

    this.simulation = d3.forceSimulation<Tag>()
      .force('charge', d3.forceManyBody().strength(-30))
      .force('collision', d3.forceCollide().radius(d => (d.r || 10) + 5))
      .force('center', d3.forceCenter(options.width / 2, options.height / 2))
       .alphaDecay(0.05);

      this.simulation.on('tick', () => {
        this.tick(); // Call the tick handler
        if (this.options.onPositionsUpdated) { //Emit position
            this.options.onPositionsUpdated(this.simulation.nodes());
        }
      });
  }

  update(nodes: Tag[], links: any[]) {
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Update simulation (do this *before* updating DOM elements)
      this.simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id((d: any) => d.id).distance(150).strength(0.5))
        .alphaTarget(0.1) // Briefly increase alpha for smoother transitions
        .restart(); // Restart the simulation

    // --- Links ---
    const linkSelection = this.svg.selectAll<SVGLineElement, any>('.link')
      .data(links, (d: any) => `${d.source.id}-${d.target.id}`); // Key function

    linkSelection.exit().remove();

    const linkEnter = linkSelection.enter()
      .append('line')
      .attr('class', 'link')
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", d => Math.sqrt(d.value));

    // Merge enter and update selections
    const link = linkEnter.merge(linkSelection);

    // --- Nodes ---
    const nodeSelection = this.svg.selectAll<SVGGElement, Tag>('.node')
      .data(nodes, (d: Tag) => d.id); // Key function!

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'node')
      .call(this.drag(this.simulation)) // Attach drag handler
      .on('click', (event: MouseEvent, d: Tag) => {
        if (this.options.onNodeClick) {
          this.options.onNodeClick(event, d);
        }
      });

    nodeEnter.append('circle')
      .attr('r', d => d.r || 10)
      .attr("fill", d => d.selected ? "#4CAF50" : color(d.zone))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

      nodeEnter.each(function(d: any) {
            if(d.id !== 'root'){
                const node = d3.select(this);
                const lines = formatNodeText(d.text);

                lines.forEach((line, i) => {
                node.append("text")
                    .text(line)
                    .attr("x", 0)
                    .attr("y", d.r + 10 + (i * 12)) // 12px line height
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .attr("class", "node-text");
                });
            }
        });

    // Merge enter and update selections
    const node = nodeEnter.merge(nodeSelection);

     node.select('circle') // Apply to existing and new nodes
      .attr('r', d => d.r || 10) // Use a default radius if d.r is undefined
      .attr('fill', d => d.selected ? '#4CAF50' : color(d.zone))
      .classed('loading-node', d => d.isLoading === true);
  }
    private drag(simulation: d3.Simulation<any, any>) {
    const dragstarted = (event: d3.D3DragEvent<any, any, any>) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;

    };

    const dragged = (event: d3.D3DragEvent<any, any, any>) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event: d3.D3DragEvent<any, any, any>) => {
      if (!event.active) simulation.alphaTarget(0);
        //  event.subject.fx = null;  //Uncomment to unfix position
        //  event.subject.fy = null;  //Uncomment to unfix position
    };

    return d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  private tick() {
    // Update link positions
    this.svg.selectAll<SVGLineElement, any>('.link')
      .attr('x1', d => d.source.x!)
      .attr('y1', d => d.source.y!)
      .attr('x2', d => d.target.x!)
      .attr('y2', d => d.target.y!);

    // Update node positions
    this.svg.selectAll<SVGGElement, Tag>('.node')
      .attr('transform', d => `translate(${d.x},${d.y})`);
  }

  destroy() {
    this.simulation.stop();
    this.svg.remove(); // Clean up the SVG element
  }
}
function formatNodeText(text: string): string[] {
  const prepositions = ['of', 'in', 'on', 'at', 'by', 'for', 'with', 'to', '&', 'and'];
  const words = text.split(' ');
  const lines: string[] = [];

  for (let i = 0; i < words.length; i++) {
    if (prepositions.includes(words[i].toLowerCase()) && i < words.length - 1) {
      lines.push(`${words[i]} ${words[i + 1]}`);
      i++;
    } else {
      lines.push(words[i]);
    }
  }
  return lines;
}