hase 1 (MVP) completion is the priority. Let's get laser-focused on solidifying that foundation with detailed, actionable tasks, suitable for a code agent.
We'll take the MVP definition from our previous discussions and your vision document and break it down into granular tasks.
Phase 1 (MVP) Detailed Task Breakdown for DreamSeed
The overarching goal of Phase 1 is to have a stable, secure, and usable version demonstrating the core value proposition: visual exploration leading to AI-augmented prompt and image generation, with the ability to save and load these explorations.
Feature 1.0: Core Graph Interaction & Visualization (MVP)
Goal: Ensure the D3 force graph is stable, renders nodes and links correctly, and basic user interactions (selection, dragging) are smooth. One primary interaction mode ("Lucid Dream Weaving - Simplified") is functional.
Task 1.1.1: Stabilize D3 Force Simulation
Description: Review and ensure the D3 force simulation in ForceGraph.vue is stable and prevents nodes from flying off-canvas or overlapping excessively for a moderate number of nodes (e.g., up to 20-30).
Affected Components/Files: ForceGraph.vue, composables/useForceSimulation.ts
Implementation Details/Acceptance Criteria:
Verify charge, center, link, and collision forces are appropriately tuned.
Nodes should settle into a reasonably discernible layout without continuous erratic movement after initial rendering or interaction.
Ensure velocityDecay is set to a value that allows stabilization (e.g., 0.7-0.8).
Test with initial nodes and after adding a few child/AI-suggested nodes.
Task 1.1.2: Basic Node Rendering & Styling
Description: Nodes render correctly with their text. Selected nodes are visually distinct.
Affected Components/Files: ForceGraph.vue, composables/useNodeStyling.ts
Implementation Details/Acceptance Criteria:
applyNodeStyle in useNodeStyling.ts should correctly apply default styles.
Selected nodes should have a clear visual indicator (e.g., different fill color based on getNodeGradient, thicker stroke as defined).
Node text is centered and legible below the node. Multi-line text for long node names should be implemented.
Ensure createNodeGradients in useNodeStyling.ts correctly sets up gradients for selected states if not already robust.
Task 1.1.3: Basic Link Rendering
Description: Links between parent and child nodes are rendered clearly.
Affected Components/Files: ForceGraph.vue, composables/useLinkStyling.ts
Implementation Details/Acceptance Criteria:
Links are drawn between connected nodes as defined in props.links.
applyLinkStyle in useLinkStyling.ts provides a default visual style for links.
Ensure createLinkGradient (or similar for basic link styling) is functional.
Task 1.1.4: Node Selection Logic (Store)
Description: Implement toggleTag logic in tagStore.ts for the MVP "Lucid Dream Weaving - Simplified" mode.
Affected Components/Files: store/tagStore.ts, services/tagSelectionService.ts
Implementation Details/Acceptance Criteria:
Clicking an unselected node selects it.
If a top-level (parent) node is clicked, any other selected top-level node in the same zone is deselected along with its descendants.
Clicking a selected node deselects it. If it's a parent, its dynamic children (AI-suggested) are removed, and predefined children are deselected.
Selected state is correctly reflected in the tags array.
hasUnsavedChanges flag in tagStore.ts is set to true when selection changes.
Task 1.1.5: Node Dragging & Position Persistence
Description: Users can drag nodes. Node positions are saved when switching zones or explicitly saving a Dream.
Affected Components/Files: ForceGraph.vue, TagCloud.vue, store/tagStore.ts
Implementation Details/Acceptance Criteria:
createDragBehavior in composables/useForceSimulation.ts is correctly applied to nodes.
Nodes can be dragged and their fx, fy properties are updated during drag, then nulled on drag end to allow simulation to resettle them unless they are pinned.
ForceGraph.vue emits nodePositionsUpdated with { id, x, y }[] on onBeforeUnmount (zone switch) or before saving.
TagCloud.vue's handleNodePositionsUpdated updates tagStore.ts with these positions. These positions should be part of the data saved for a Dream.
Task 1.1.6: Zone Switching with State Preservation
Description: Implement basic zone switching via ZoneSelector.vue. Graph state (node selections, positions if saved for that zone's nodes) is preserved.
Affected Components/Files: TagCloud.vue, ZoneSelector.vue, store/tagStore.ts, ForceGraph.vue
Implementation Details/Acceptance Criteria:
Clicking a zone button in ZoneSelector.vue updates selectedZone in TagCloud.vue.
tagStore.setFocusedZone updates the focusedZone state.
ForceGraph.vue re-renders with nodes and links for the new focusedZone (via graphNodes and graphLinks computeds).
Selected states of nodes are maintained across zone switches.
Node x, y positions are restored if previously saved for nodes in that zone (this relies on handleNodePositionsUpdated and loading logic). Viewport state per zone is a Phase 2/3 feature, so basic graph recentering might occur.
tagStore.saveZoneViewport and tagStore.getZoneViewport should be used to save/restore the zoom/pan state when switching zones. Ensure ForceGraph.vue calls these via its applyViewport and getCurrentViewport exposed methods.
Feature 1.2: Basic AI Tag Suggestions (MVP)
Goal: When a node is selected, the system fetches and displays a small set of AI-generated related tags as dynamic children.
Task 1.2.1: AI Suggestion Fetching Logic
Description: Implement logic in tagSelectionService.ts (within toggleTag or a new function called by it) to trigger AI suggestions when a node is selected and doesn't have pre-defined children, or after predefined children are shown.
Affected Components/Files: services/tagSelectionService.ts, services/tagGenerationService.ts
Implementation Details/Acceptance Criteria:
When a tag is newly selected:
If it has predefined children, they are shown.
Then, (or if no predefined children) call generateRelatedTags from tagGenerationService.ts.
generateRelatedTags should construct a basic prompt for Gemini (e.g., "Suggest 3-5 tags related to '[selected_tag_text]' within the category '[selected_tag_zone]' that are not in '[list_of_existing_children_texts]'").
The ancestorChain parameter in generateRelatedTags should be populated with the parent of the current parentTag (if any) for basic path context.
The backend proxy /api/gemini is called.
tagStore.sessionId should be passed or used to ensure suggestions are for the current context.
Task 1.2.2: Processing and Displaying AI Suggestions
Description: New tags from AI are added as dynamic children to the selected node in the tagStore and rendered in ForceGraph.vue.
Affected Components/Files: services/tagSelectionService.ts, store/tagStore.ts, ForceGraph.vue
Implementation Details/Acceptance Criteria:
generateRelatedTags returns an array of new Tag objects (ensure they have unique IDs, e.g., parentTag.id + '-dyn-' + uuidv4()).
These new tags are added to the children array of the selected parentTag in tagStore.ts and also to the main tags array.
ForceGraph.vue dynamically updates to show these new child nodes and links from the parent.
Dynamic children are visually distinguishable if desired for MVP (e.g., slightly different default style, or this can be deferred).
Task 1.2.3: AI Suggestion Loading State
Description: The selected node shows a loading indicator while AI suggestions are being fetched.
Affected Components/Files: store/tagStore.ts (add isLoading to Tag interface if not present), ForceGraph.vue, composables/useNodeStyling.ts
Implementation Details/Acceptance Criteria:
Tag interface includes isLoading?: boolean.
Set tag.isLoading = true before calling generateRelatedTags and false after.
applyNodeStyle in useNodeStyling.ts should render a visual loading state for the node circle (e.g., a subtle animation, opacity change, or small spinner icon if feasible for MVP).
Feature 1.3: Basic Dynamic Prompt Generation (MVP)
Goal: A simple text prompt is generated based on currently selected tags.
Task 1.3.1: Implement Prompt Generation Logic
Description: Create or update promptGenerationService.ts or logic within TagCloud.vue / tagStore.ts to generate a basic prompt.
Affected Components/Files: services/promptGenerationService.ts (or TagCloud.vue / store/tagStore.ts)
Implementation Details/Acceptance Criteria:
The prompt is a comma-separated string of the text property of all tag.selected === true tags.
Order could be based on selection order, or grouped by zone, or simple alphabetical for MVP.
The generated prompt is stored in tagStore.currentGeneratedPrompt.
TagCloud.vue displays tagStore.currentGeneratedPrompt.
The prompt updates automatically whenever tag selections change.
Feature 1.4: Basic Image Generation & Display (MVP)
Goal: User can trigger image generation using the current dynamic prompt, and the image is displayed.
Task 1.4.1: Trigger Image Generation
Description: Add a "Generate Image" button in TagCloud.vue. Clicking it uses imageGenerationService.ts to call the backend.
Affected Components/Files: TagCloud.vue, services/imageGenerationService.ts
Implementation Details/Acceptance Criteria:
Button is present in TagCloud.vue.
Clicking it calls generateImageFromPrompt with tagStore.currentGeneratedPrompt.
Button should be disabled if no prompt is available or if generation is in progress.
Task 1.4.2: Display Generated Image
Description: The fetched image (base64 string) is displayed in the image preview area of TagCloud.vue.
Affected Components/Files: TagCloud.vue, store/tagStore.ts
Implementation Details/Acceptance Criteria:
generateImageFromPrompt returns a base64 image string.
This string is stored in tagStore.currentImageUrl.
TagCloud.vue's image preview area updates to display the new image.
A placeholder is shown if currentImageUrl is null.
Task 1.4.3: Image Generation Loading State
Description: UI indicates that image generation is in progress.
Affected Components/Files: TagCloud.vue (or composables/useImageGeneration.ts)
Implementation Details/Acceptance Criteria:
"Generate Image" button shows a loading state (e.g., spinner).
Image preview area might show a loading indicator.
isGeneratingImage ref (from useImageGeneration composable) controls these states.
Feature 1.5: Basic Dream Saving & Loading (MVP)
Goal: Users can save their current exploration (graph state, title) and load it back.
Task 1.5.1: Backend API for Dreams
Description: Ensure POST /api/dreams and GET /api/dreams are functional for creating and listing dreams for the authenticated user. The PUT /api/dreams/:id for updating title.
Affected Components/Files: server/api/dreams/index.post.ts, server/api/dreams/index.get.ts, server/api/dreams/[id].put.ts
Implementation Details/Acceptance Criteria:
POST /api/dreams: Accepts data (JSON of graph state: { focusedZone, tags: [{id, text, selected, x, y, parentId, zone, childrenIdsMaybe?}], generatedPrompt, imageUrl, zoneViewports }) and optional title. Saves to DB linked to userId. Returns the created Dream.
GET /api/dreams: Returns a list of Dreams for the authenticated user, ordered by createdAt desc.
PUT /api/dreams/:id: Accepts { title }. Updates dream title.
All routes are authenticated and authorized.
Task 1.5.2: Save Dream Functionality (Client)
Description: Implement "Save Dream" functionality using useDreamManagement.ts and tagStore.ts.
Affected Components/Files: TagCloud.vue, composables/useDreamManagement.ts, store/tagStore.ts
Implementation Details/Acceptance Criteria:
handleSaveDreamClick in TagCloud.vue calls initiateSaveDreamProcess.
initiateSaveDreamProcess prepares the dreamDataPayload (current focusedZone, relevant tags data including id, text, selected, x, y, parentId, zone, children (as IDs or minimal representation if too complex for direct save), currentGeneratedPrompt, currentImageUrl, and zoneViewports from tagStore.getAllZoneViewportsObject()).
If tagStore.loadedDreamId is null, it calls performSaveAsNew (POST to /api/dreams).
If tagStore.loadedDreamId exists, it prompts user to "Update Existing" or "Save as New". Update calls POST /api/dreams with dreamIdToUpdate.
On successful save/update, tagStore.loadedDreamId is updated, hasUnsavedChanges becomes false, and the dreams list is refreshed.
A toast notification confirms success.
Task 1.5.3: Load Dream Functionality (Client)
Description: Display list of saved dreams; clicking one loads its state.
Affected Components/Files: TagCloud.vue (sidebar), composables/useDreamManagement.ts, store/tagStore.ts
Implementation Details/Acceptance Criteria:
TagCloud.vue sidebar (managed by useDreamManagement) lists savedDreams.
Clicking a dream calls loadDream(dream).
loadDream uses tagStore.loadDreamState(dream.data, dream.id).
tagStore.loadDreamState correctly parses the saved data and updates focusedZone, tags (reconstructing node objects with positions and selections), currentGeneratedPrompt, currentImageUrl, and zoneViewports (calling applyViewport on ForceGraph.vue for the loaded zone).
The graph updates to reflect the loaded state.
hasUnsavedChanges is set to false after loading.
Task 1.5.4: "Current Session" / "New Dream" Logic
Description: Implement logic for handling the "Current Session" (unsaved) and "New Dream" states.
Affected Components/Files: TagCloud.vue, composables/useDreamManagement.ts, store/tagStore.ts
Implementation Details/Acceptance Criteria:
If loadedDreamId is null, the current state is the "Current Session".
"New Dream" button calls handleAddNewDream which resets the store to initial state (resetToCurrentSession({isNewDream: true})) and clears loadedDreamId.
If hasUnsavedChanges is true, prompt user before loading a different dream or starting a new one.
Feature 1.6: Secure AI API Key Handling (MVP Verification)
Goal: All AI API calls are proxied through the backend, and API keys are not exposed to the client.
Task 1.6.1: Verify Backend Proxies
Description: Confirm that /api/gemini (for text/suggestions) and /api/gemini-image (for images) are correctly implemented, use API keys from server-side environment variables, and do not expose keys.
Affected Components/Files: server/api/gemini.ts, server/api/gemini-image.ts, nuxt.config.ts (runtimeConfig)
Implementation Details/Acceptance Criteria:
API keys are read from runtimeConfig (sourced from environment variables) within the server routes.
Client-side services (tagGenerationService.ts, imageGenerationService.ts) exclusively call these backend proxies.
No API keys are present in client-side code or network requests from the browser to external AI services.
Feature 1.7: Essential Error Handling & Loading States (MVP)
Goal: The application provides clear feedback for loading states and handles errors gracefully.
Task 1.7.1: Implement API Call Loading States
Description: Show loading indicators for AI suggestions, image generation, saving/loading dreams.
Affected Components/Files: TagCloud.vue, ForceGraph.vue, relevant composables/services.
Implementation Details/Acceptance Criteria:
tag.isLoading for individual node suggestions (Task 1.2.3).
isGeneratingImageFromComposable for image generation button/preview.
isSavingDreamFromComposable for save button.
pending state from useFetch for loading dreams list.
Use ProgressSpinner or similar PrimeVue components.
Task 1.7.2: Implement API Call Error Handling
Description: Display user-friendly error messages (toasts) for failed API calls.
Affected Components/Files: TagCloud.vue, services, composables.
Implementation Details/Acceptance Criteria:
All fetch calls and service functions should catch errors.
Use PrimeVue useToast() to display errors (e.g., "Failed to get AI suggestions", "Image generation failed", "Could not save dream").
Server-side errors should return appropriate HTTP status codes and structured error messages if possible.
