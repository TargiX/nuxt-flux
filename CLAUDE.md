# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
pnpm dev                # Local development server
pnpm dev:local         # Development with .env.local
pnpm dev:prod          # Development with .env.production
pnpm build             # Production build
pnpm preview           # Preview production build
```

### Database Management
```bash
pnpm db:studio:local   # Prisma Studio for local DB
pnpm db:studio:prod    # Prisma Studio for production DB
pnpm db:migrate:local  # Apply migrations to local DB
pnpm db:migrate:prod   # Apply migrations to production DB
```

### Testing & Quality
```bash
pnpm test              # Run Vitest tests
pnpm lint              # ESLint check
pnpm lint:fix          # Auto-fix linting issues
pnpm format            # Prettier formatting
```

## Application Architecture

### Core Concept
This is a Nuxt.js application that combines D3.js force-directed graph visualization with AI-powered image generation. Users create "dreams" by selecting tags in an interactive force graph, which generates AI prompts and images using Gemini/Flux APIs.

### Key Components Architecture

**ForceGraph.vue** - Self-contained D3 visualization engine using composable-driven architecture:
- `useZoom` - viewport management with pan/zoom
- `useNodeStyling` - node appearance and animations  
- `useLinkStyling` - connection styling with gradients
- `useForceSimulation` - physics simulation management

**TagCloud.vue** - Master orchestrator combining graph, image generation, and session management:
- Multi-view interface (graph/image preview)
- Snapshot system for viewing historical states
- Auto-save functionality before image generation
- Integrates `useImageGeneration`, `useDreamManagement`, `useImageDownloader`

### Data Flow Pattern

**TagStore (Pinia)** serves as the central state hub:
- Tags & graph data with hierarchical relationships
- Zone management for different visualization areas
- Viewport states (saved pan/zoom per zone)
- Session state with snapshot/restore capabilities
- Bi-directional sync with backend via dream CRUD operations

**Database Schema (Prisma)**:
- `User` → `Dream[]` → `GeneratedImage[]`
- Dreams store graph state as JSON with tags and viewports
- Generated images include graph state snapshots

### AI Integration Pipeline
1. Tag selection → Prompt generation (Gemini API)
2. Enhanced prompt → Image generation (Gemini/Flux)
3. Base64 image → S3 upload → Database storage
4. Graph state snapshot saved with each image

### Service Layer
- `imageGenerationService.ts` - AI image creation with cooldowns
- `promptGenerationService.ts` - Gemini prompt enhancement
- `tagSelectionService.ts` - Dynamic tag generation and concept expansion
- `imageService.ts` - Database operations for generated images

## Key Development Patterns

### Composable-Driven Architecture
Each composable handles a single domain with reactive patterns. Components communicate via props/events, with cross-component state managed through Pinia store.

### Performance Optimizations
- D3 render loop at 60fps independent of simulation frequency
- Batched DOM updates with requestAnimationFrame
- Debounced operations for prompts and position updates
- Request deduplication via Nuxt caching

### Error Handling
Services return structured error objects. Components handle errors gracefully with user feedback. AI service failures have fallback strategies.

## Authentication
Uses Auth.js with hybrid authentication (Google OAuth + email/password). JWT sessions with secure cookies. Global middleware protects routes with automatic redirects.

## Environment Setup
Requires `.env.local` or `.env.production` with:
- Database connection strings
- AI service API keys (Gemini, Flux)
- AWS S3 credentials
- NextAuth secrets

Use environment-specific commands for development and database operations.