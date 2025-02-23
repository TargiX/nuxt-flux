# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install the dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm run build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm run preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.



Overview
This is a Nuxt.js application with Vue.js and D3.js, designed to visualize and interact with a tag-based system for generating image prompts. Users can select tags organized by zones (e.g., Subject), with parent tags (e.g., Humans, Animals) and secondary tags (e.g., Adult Male, Mammals) displayed in a force-directed graph. The project aims to eventually support dynamic tags (fetched from a server) and hybrid tags (combinations of selected tags).

Core Components
TagCloud.vue: The main UI component, orchestrating zone switching and node interactions, interfacing with the store.
ForceGraph.vue: A reusable D3.js force-directed graph component, rendering nodes and links based on props, emitting events for interactions.
tagStore.ts: A Pinia store managing tags, zones, and graph data (nodes and links).

Project Structure
components/
  TagCloud.vue
  ForceGraph.vue
stores/
  tagStore.ts
types/
  (future: shared interfaces like Tag)
utils/
  (future: layout helpers if needed)

Core Functionalities
1. Zone-Based Tag System
Description: Tags are grouped into zones (e.g., Subject), each containing parent tags with optional secondary tags.
Implementation:
tagStore.ts holds zones (Subject), parent tags (Humans, Animals), and secondary tags (Adult Male, etc.).
TagCloud.vue displays the current zone via focusedZone and switches with buttons.
Behavior: Only one zone is active at a time, showing its parent tags initially; selecting a parent reveals its secondary tags.
2. Force-Directed Graph Visualization
Description: Displays tags as nodes and relationships as links in a dynamic graph.
Implementation:
ForceGraph.vue uses D3’s forceSimulation to position nodes (props.nodes) and links (props.links).
Nodes are <g> elements with <circle> (visual) and <text> (label); links are <line> elements.
Behavior: 
Parent nodes start centered (e.g., (300, 200)), secondary tags grow around them when selected.
Nodes are draggable, with positions saved on zone switch.
3. Node Selection
Description: Users can select parent and secondary tags, indicated by a green color (#4CAF50).
Implementation:
tagStore.toggleTag(id) toggles selected state.
ForceGraph.vue updates fill in updateNodes based on selected.
Behavior: Selection persists across zone switches, visually updated in real-time.
4. State Persistence
Description: Node positions (x, y) and selections (selected) persist when switching zones.
Implementation:
ForceGraph.vue emits nodePositionsUpdated on unmount, sending { id, x, y }.
TagCloud.vue updates tagStore.tags with these positions.
Behavior: Nodes retain their last dragged positions and selection state.

Core Implementation Details
tagStore.ts
State:
tags: Flat array of all tags (parents and secondaries), with x, y, selected.
zones: Array of zone names (e.g., ["Subject"]).
focusedZone: Current zone (e.g., "Subject").

Actions:
setFocusedZone(zone): Switches zones without resetting state.
toggleTag(id): Toggles selected, deselects other parents if a parent is clicked.
Getters:
graphNodes: Returns parent tags or selected parent + secondary tags.
graphLinks: Links from selected parent to its secondary tags.
ForceGraph.vue
Props: width, height, nodes, links.
Emits: 
nodeClick(id): Fired on node click.
nodePositionsUpdated(positions): Fired on unmount with { id, x, y }[].
Key Functions:
initializeGraph: Sets up SVG, simulation, and initial positions.
updateGraph: Updates simulation with pinned parent and secondary tag positions.
updateNodes: Renders nodes, applies selected color.
saveNodePositions: Emits updated positions.
TagCloud.vue
Computed: focusedZone, zones, graphNodes, graphLinks from tagStore.
Handlers:
handleNodeClick: Calls toggleTag.
switchToZone: Calls setFocusedZone.
handleNodePositionsUpdated: Updates tagStore.tags with positions.

Potential Issues
Simulation Instability:
Cause: Strong forces (e.g., charge, center) or low velocityDecay can make nodes fly off-canvas.
Fix: Keep forces minimal (charge: -20, center.strength: 0.05, velocityDecay: 0.8) and pin nodes initially.
Reactivity Loops:
Cause: D3 updating x and y in props.nodes triggers Vue’s watch, restarting the simulation.
Fix: Watch only structural/state changes (id, text, size, selected), not x/y.
Secondary Tag Positioning:
Cause: Undefined x/y for secondary tags causes erratic parent movement.
Fix: Set secondary tags’ initial x/y to the parent’s position in updateGraph.
Performance with Many Nodes:
Cause: Large numbers of nodes/links slow D3 rendering.
Fix: Optimize updateNodes (e.g., batch updates), consider throttling simulation ticks.
No-No Hints (Avoid These Pitfalls)
Don’t Use Store in ForceGraph.vue:
Why: Breaks modularity; ForceGraph should be a dumb component using only props and emits.
Do: Emit events (e.g., nodePositionsUpdated) and let the parent (TagCloud.vue) update the store.
Don’t Mutate props.nodes Reactively Without Control:
Why: D3’s simulation updates x and y, triggering Vue watchers and causing infinite loops.
Do: Watch only non-positional properties or use a throttle/debounce if position updates are needed.
Don’t Clone Nodes Unnecessarily:
Why: Cloning breaks D3’s reference to node objects, resetting positions or causing sync issues.
Do: Use props.nodes directly and manage positions via emits.
Don’t Overpower Simulation Forces:
Why: Strong charge or center forces make nodes fly unpredictably.
Do: Use minimal forces (charge: -20, center: 0.05) and pin key nodes with fx/fy.
Don’t Skip Position Saving:
Why: Without saveNodePositions, x and y reset on zone switches.
Do: Always emit positions on unmount and update the store.

Future Expansion
Planned Features
Dynamic Tags:
Fetch secondary tags from a server on parent click.
Add isLoading to Tag for a flashing state during fetch.
Hybrid Tags:
Create a new tag combining two selected tags (e.g., Adult Male + Mammals).
Add to graphNodes with links to parents.
Node Enhancements:
Icons: Add <image> in <g> via icon property.
Dropdown Menus: Emit showMenu on right-click, render in TagCloud.vue.
Foundation Readiness
Robust: Handles selected, positions, and basic structure.
Extensible: Tag interface and updateNodes support new properties (e.g., isLoading, icon).
Modular: ForceGraph.vue stays agnostic, ready for new emits or props.
Testing Checklist
Initial Load: Parent nodes start at (300, 200) and stabilize.
Parent Selection: Click a parent → Stays put, secondary tags grow around it, turns green.
Secondary Selection: Click a secondary tag → Turns green, state persists.
Zone Switch: Switch zones → Positions and selections persist.
No Loops: Console logs only on clicks/switches, not ticks.
