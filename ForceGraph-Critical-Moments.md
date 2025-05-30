# ForceGraph Critical Moments

Below are the key sections from the previous working implementation—capture these and compare with your latest branch to see what changed.

---

## 1. `updateNodes()` Data Join & Merge
```ts
const node = nodeGroup
  .selectAll<SVGGElement, GraphNode>('g.node')
  .data(props.nodes, d => d.id);

const nodeEnter = node.enter()
  .append('g')
  .attr('class', 'node')
  .call(createDragBehavior(simulation))
  .on('dblclick', (event, d) => {
    // startTextEdit on double-click
    const textEls = selectAllTextElements(event.currentTarget);
    startTextEdit(event, d, event.currentTarget, textEls, updateTextForNode);
  })
  .on('click', (event, d) => {
    // node selection & centering
    emit('nodeClick', d.id);
    updateNodeSelection(d.id);
  });

// Merge ENTER + UPDATE once:
const nodeMerge = nodeEnter.merge(node);
nodeMerge.each(d => applyNodeStyle(d3.select(this), false, svg, updateTextForNode));
nodeMerge.raise();       // bring all nodes above links
node.exit().remove();
```

**Why it matters:**
- Handlers bound only once on `nodeEnter` persist through ticks.
- Single `applyNodeStyle` prevents re-creating `<text>` without handlers.
- `.raise()` ensures nodes (and text) stay on top.

---

## 2. `applyNodeStyle` Text Binding
```ts
selection.each(function(d) {
  const nodeGroup = d3.select(this);
  // only remove editor & loading icons, not text:
  nodeGroup.selectAll('.node-text-editor-fo, .loading-indicator').remove();

  const lines = formatNodeText(d.text);
  lines.forEach((line, i) => {
    const textEl = nodeGroup.append('text')
      .attr('class', 'node-text')
      .attr(...)
      .text(line)
      .attr('data-node-id', d.id)
      .on('click.textEdit', e => {
        e.stopPropagation();
        startTextEdit(e, d, this, /* textEls */ [...], updateTextForNode);
      });
    textEls.push(textEl);
  });
});
```

**Why it matters:**
- Only text elements are removed on edit cancel, preserving handlers.
- Namespaced event (`.textEdit`) prevents accidental overwrite.

---

## 3. Zoom Filter to Preserve Clicks
```ts
const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([0.1, 8])
  .filter(event => {
    const t = event.target as HTMLElement;
    if (t.tagName === 'text') return false;
    if (t.tagName === 'input') return false;
    if (t.closest('.node-text-editor-fo')) return false;
    return (!event.ctrlKey && !event.button && !event.shiftKey);
  })
  .on('zoom', e => g.attr('transform', e.transform.toString()));
svg.call(zoomBehavior);
```

**Why it matters:**
- Prevents D3.zoom from stealing clicks on labels or editor inputs.

---

## 4. Drag Filter to Avoid Label Interference
```ts
const dragBehavior = d3.drag<SVGGElement, GraphNode>()
  .filter(event => {
    const t = event.target as HTMLElement;
    if (t.tagName === 'text' || t.tagName === 'input') return false;
    if (t.closest('.node-text-editor-fo')) return false;
    return event.button === 0;
  })
  .on('start', ...)
  .on('drag', ...)
  .on('end', ...);
```

**Why it matters:**
- Drag actions ignore clicks on text or input fields, so editing works.

---

## 5. Layering & `.raise()` Strategy
- **On `nodeMerge`:** `nodeMerge.raise()` so all node `<g>` sit atop link `<line>` elements.
- **On selected nodes:** `selection.raise()` inside `applyNodeStyle` to highlight selected nodes.

**Why it matters:**
- Ensures no SVG element overlays your text, so click events reach them.

---

_Steps to Compare:_
1. Check your current `updateNodes()` shape vs above structure.
2. Verify you bind edit handlers only once on node enter/merge, not in repetitive loops.
3. Confirm zoom & drag filters include the same exclusions.
4. Ensure you call `.raise()` on the merged node selection.
5. Compare `applyNodeStyle` implementation for text removal vs recreation logic.

Use this as your checklist when switching branches to pinpoint where the behavior diverged. 