# AI Development Standards for Nuxt-Flux Project

## Package Management

- **ALWAYS use pnpm** for all package operations
- **NEVER use npm or yarn** - this project uses pnpm@9.12.3+
- Use `pnpm install` for adding dependencies
- Use `pnpm add <package>` for new packages
- Use `pnpm add -D <package>` for dev dependencies
- **DO NOT restart the local server** after package installation - it runs continuously

## Database Operations

### Prisma Client Configuration
- **Custom client path**: `../generated/prisma/client` - NEVER change this
- **ALWAYS import Prisma client** from `~/server/utils/db` in server code
- **NEVER import directly** from `@prisma/client` in server routes

### Database Schema Rules
- **User model**: Uses CUID for id field, NEVER use autoincrement
- **Dream model**: Uses autoincrement for id, stores JSON data
- **GeneratedImage model**: Uses autoincrement, requires dreamId and userId
- **ALWAYS add indexes** for foreign key fields when creating new models
- **ALWAYS use cascade deletion** for dependent relationships

### Migration Workflow
- **BEFORE schema changes**: Run `pnpm prisma db push` for development
- **FOR production**: Create migration with `pnpm prisma migrate dev --name <description>`
- **AFTER schema changes**: Run `pnpm prisma generate` to update client
- **NEVER modify existing migrations** - create new ones

## Authentication System

### AuthJS Configuration
- **Authentication provider**: `@hebilicious/authjs-nuxt`
- **Session strategy**: JWT only - NEVER use database sessions
- **Required environment variables**: `NUXT_NEXTAUTH_SECRET`, `NUXT_GOOGLE_CLIENT_ID`, `NUXT_GOOGLE_CLIENT_SECRET`

### User Creation Patterns
- **Google OAuth**: Auto-create users in signIn callback
- **Credentials**: Validate in authorize function, create in signIn callback
- **ALWAYS hash passwords** with bcrypt for credentials provider
- **ALWAYS check user existence** before creation to prevent duplicates

### Session Management
- **User ID**: ALWAYS use internal CUID from database, not OAuth provider ID
- **Token population**: Fetch user from database in JWT callback for Google OAuth
- **Session object**: Include id, name, email, image fields
- **NEVER expose** password hashes in session or tokens

## Component Development

### PrimeVue Integration
- **ALWAYS use PrimeVue components** instead of custom UI components
- **Auto-import enabled**: No need to import PrimeVue components manually
- **Theme**: Uses custom Aura preset with indigo primary colors
- **Icons**: Use PrimeIcons - import from 'primeicons/primeicons.css'

### Vue 3 Composition API
- **ALWAYS use Composition API** with `<script setup>` syntax
- **State management**: Use Pinia stores for global state
- **Reactivity**: Use `ref()` for primitives, `reactive()` for objects
- **Computed properties**: Use `computed()` for derived state
- **Lifecycle**: Use `onMounted()`, `onUnmounted()` etc.

### Component Structure
- **Large components**: Break into smaller composables when > 500 lines
- **Props**: Define with TypeScript interfaces
- **Emits**: Explicitly define all emitted events
- **Slots**: Use named slots for complex layouts

## API Development

### Server Route Structure
- **Base path**: `server/api/`
- **Authentication routes**: `server/api/auth/[...].ts` (catch-all for AuthJS)
- **Feature routes**: Group by feature (dreams/, images/, etc.)
- **File naming**: Use kebab-case for route files

### Error Handling
- **ALWAYS use try-catch** blocks in API routes
- **Return structured errors**: `{ error: 'message', code: 'ERROR_CODE' }`
- **HTTP status codes**: Use appropriate codes (400, 401, 403, 404, 500)
- **Logging**: Use `console.error()` for server errors

### Authentication Checks
- **Protected routes**: Check session with `await getServerSession(event, authOptions)`
- **User validation**: Verify user exists in database after session check
- **Authorization**: Check user permissions for resource access
- **NEVER trust client-side authentication** state

## Styling System

### Tailwind CSS Configuration
- **Config file**: `tailwind.config.js` - NEVER modify nuxt.config.ts for Tailwind
- **PrimeUI integration**: Uses `tailwindcss-primeui` plugin
- **Custom classes**: Add to `assets/scss/` files, not inline styles
- **Responsive design**: Use Tailwind responsive prefixes (sm:, md:, lg:, xl:)

### SCSS Preprocessing
- **Main file**: `assets/scss/main.scss` - imported in nuxt.config.ts
- **Variables**: `assets/scss/variables.scss` - auto-imported in all SCSS files
- **Component styles**: Use scoped styles in Vue components
- **Global styles**: Add to main.scss, not component files

### Theme Customization
- **PrimeVue theme**: Custom Aura preset with indigo primary colors
- **Dark mode**: Uses `.my-app-dark` selector
- **NEVER modify**: PrimeVue theme files directly - use preset overrides

## File Coordination Requirements

### Multi-File Updates
- **When modifying Prisma schema**: Update `prisma/schema.prisma` → Run `pnpm prisma generate` → Update related API routes
- **When adding new API routes**: Create route file → Update types if needed → Test authentication
- **When modifying auth config**: Update `server/api/auth/[...].ts` → Update runtime config → Test all auth flows
- **When adding environment variables**: Update `.env.example` → Update `nuxt.config.ts` runtimeConfig → Document in README

### Component Dependencies
- **When creating new components**: Add to `components/` → Auto-import works → Update parent components
- **When modifying shared composables**: Update `composables/` → Check all usage → Update types
- **When updating stores**: Modify `store/` → Update component usage → Test state persistence

## Environment Configuration

### Runtime Config Pattern
- **Server-only config**: Add to `runtimeConfig` object
- **Client-accessible config**: Add to `runtimeConfig.public` object
- **Environment variables**: Prefix with `NUXT_` for auto-mapping
- **Secrets**: NEVER expose in public config

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NUXT_NEXTAUTH_SECRET` - JWT signing secret
- `NUXT_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `NUXT_GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GEMINI_API_KEY` - Google Gemini API key
- `FLUX_API_KEY` - Flux image generation API key

## Type Safety Requirements

### TypeScript Configuration
- **Strict mode**: ALWAYS enabled - NEVER disable
- **Type imports**: Use `import type` for type-only imports
- **Component props**: Define interfaces for all props
- **API responses**: Type all API response objects
- **Database queries**: Use Prisma generated types

### Type Definitions
- **Global types**: Add to `types/` directory
- **Component types**: Define inline or in separate `.d.ts` files
- **API types**: Create shared types for request/response objects
- **Store types**: Type all Pinia store state and actions

## Performance Optimization

### Asset Handling
- **Images**: Store in `public/` for static assets, use external URLs for user uploads
- **Lazy loading**: Use `v-lazy` for images, dynamic imports for components
- **Code splitting**: Use dynamic imports for large components
- **Bundle optimization**: Leverage Nuxt's auto-optimization

### Database Performance
- **Queries**: Use `select` to limit returned fields
- **Relations**: Use `include` only when necessary
- **Indexes**: Add for all foreign keys and frequently queried fields
- **Pagination**: Implement for large datasets

## User Experience Guidelines

### Toast Messages
- **AVOID success toasts** for obvious updates (form submissions, auto-saves)
- **USE animations** instead of toast messages when elements update visibly
- **ONLY use toasts** for non-obvious background operations or errors
- **Error messages**: ALWAYS show user-friendly error toasts

### Loading States
- **Form submissions**: Show loading state on submit buttons
- **Data fetching**: Use skeleton loaders or spinners
- **Image generation**: Show progress indicators for long operations
- **Navigation**: Use Nuxt's built-in loading indicators

## Prohibited Actions

### Code Patterns to AVOID
- **NEVER use npm or yarn** - only pnpm
- **NEVER import Prisma client directly** - use server utils
- **NEVER store sensitive data** in client-side state
- **NEVER use database sessions** - JWT only
- **NEVER modify existing migrations** - create new ones
- **NEVER expose API keys** in client code
- **NEVER use inline styles** - use Tailwind or SCSS
- **NEVER disable TypeScript strict mode**
- **NEVER create success toasts** for obvious UI updates

### Security Violations
- **NEVER trust client data** without server validation
- **NEVER expose user passwords** in any form
- **NEVER skip authentication checks** in protected routes
- **NEVER use HTTP for production** - HTTPS only
- **NEVER log sensitive information** (passwords, tokens, etc.)

## Development Workflow

### Before Starting Work
1. Check current branch and pull latest changes
2. Run `pnpm install` if package.json changed
3. Check database connection with `pnpm prisma db push`
4. Verify environment variables are set

### During Development
1. Use TypeScript strict mode - fix all type errors
2. Test authentication flows after auth changes
3. Run database migrations after schema changes
4. Test responsive design on multiple screen sizes
5. Verify PrimeVue components render correctly

### Before Committing
1. Run `pnpm lint:fix` to fix linting issues
2. Run `pnpm format` to format code
3. Test all modified functionality
4. Verify no console errors in browser
5. Check that build succeeds with `pnpm build`

## AI Decision-Making Guidelines

### When to Use PrimeVue vs Custom Components
- **USE PrimeVue**: For standard UI elements (buttons, inputs, dialogs, tables)
- **CREATE custom**: For domain-specific visualizations (graphs, charts, specialized layouts)
- **EXTEND PrimeVue**: When PrimeVue component needs minor modifications

### When to Create New API Routes
- **CREATE new route**: For distinct business operations
- **EXTEND existing**: For related CRUD operations on same resource
- **USE middleware**: For cross-cutting concerns (auth, logging, validation)

### When to Update Database Schema
- **ADD fields**: When new data requirements emerge
- **CREATE tables**: For new business entities
- **ADD indexes**: When query performance degrades
- **NEVER remove**: Fields or tables without migration strategy

### Error Handling Priorities
1. **Security errors**: Authentication, authorization failures
2. **Data integrity**: Database constraint violations
3. **User input**: Validation errors with helpful messages
4. **System errors**: Log for debugging, show generic message to user
5. **Network errors**: Retry logic with exponential backoff 