# AI Codex

## Usage

- Review: @codex.md (silent load, no output)
- Update: @learn.md
- File paths: Always use absolute paths from project root

## Errors

E000:

- Context: [Relevant project area or file]
- Error: [Precise description]
- Correction: [Exact fix]
- Prevention: [Specific strategy]
- Related: [IDs of related errors/learnings]

E001:

- Context: File path suggestions
- Error: Relative path used instead of absolute
- Correction: Use absolute paths from project root
- Prevention: Always prefix paths with '/'
- Related: None


## Learnings


L000:

- Context: [Relevant project area or file]
- Insight: [Concise description]
- Application: [How to apply this knowledge]
- Impact: [Potential effects on project]
- Related: [IDs of related errors/learnings]

L001:

- Context: @codex.md usage
- Insight: @codex.md is for context, not for direct modification
- Application: Use @codex.md for silent loading and context only; execute subsequent commands separately
- Impact: Improved accuracy in responding to user intentions
- Related: None

L002:
Context: store/tagStore.ts and components/ForceGraph.vue
Insight: Separation of concerns between data management and presentation logic
Application: Move size-related logic from the store to the component
Impact: Improved maintainability and clearer responsibility distribution
Related: None


L003:
Context: components/ForceGraph.vue
Insight: TypeScript linter errors in D3.js integration
Application: Need to properly type D3.js elements and event handlers
Impact: Improved type safety and code quality in visualization components
Related: None


L004:
- Context: components/ForceGraph.vue and store/tagStore.ts
- Insight: Implementing visual transitions for hybrid tag creation and removal
- Application: 
  - Use opacity transitions for smooth appearance/disappearance of nodes
  - Keep nodes in graph data structure but visually hide them
  - Update both store data and visual representation when removing hybrids
  - Ensure child tags are properly unselected when hybrid is removed
- Impact: 
  - Improved user experience with smooth transitions
  - Maintained graph stability by avoiding abrupt node removals
  - Better state management between store and visual representation
- Related: L002, L003



