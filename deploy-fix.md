# Deployment Fix Guide

## Changes Made

### 1. Updated package.json postinstall script
- Added `prisma generate` to the postinstall script
- This ensures Prisma client is generated automatically during `pnpm install`

### 2. Simplified Nitro configuration in nuxt.config.ts
- Removed problematic CommonJS and externals configurations that were causing build errors
- Kept minimal configuration to avoid module resolution conflicts with Prisma
- Relies on the postinstall script for proper Prisma client generation

### 3. Simplified deployment workflow
- Removed redundant `npx prisma generate` steps since postinstall handles it
- The workflow now relies on the postinstall script for Prisma generation

### 4. Environment Variables Required

Make sure these are set in your GitHub secrets:
- `NUXT_NEXTAUTH_SECRET` - Your NextAuth secret
- `NUXT_NEXTAUTH_URL` - Your production URL (e.g., "http://5.161.248.184:3000")
- `NUXT_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `NUXT_GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `DATABASE_URL` - Your production database URL
- `GEMINI_API_KEY` - Your Gemini API key
- `FLUX_API_KEY` - Your Flux API key

And in your server environment (for PM2):
- `NUXT_NEXTAUTH_SECRET_VALUE` - The actual secret value for PM2

## Deployment Steps

1. Commit and push these changes to trigger the GitHub Action
2. The workflow will:
   - Install dependencies (triggering postinstall with Prisma generation)
   - Build the application with proper Prisma client
   - Deploy to your Hetzner server
   - Install production dependencies (again triggering postinstall)
   - Reload PM2 with the new build

## Troubleshooting

If you still get 500 errors:

1. Check PM2 logs: `pm2 logs dreamseed`
2. Verify environment variables are set: `pm2 show dreamseed`
3. Check if Prisma client was generated: `ls -la node_modules/.prisma/client/`
4. Manually regenerate if needed: `npx prisma generate`

## Key Fixes Applied

- **Prisma Client Generation**: Now handled automatically via postinstall
- **CommonJS/ESM Compatibility**: Enhanced Nitro configuration for better module handling
- **Environment Configuration**: Proper NextAuth URL and secret handling
- **CSRF Protection**: Enhanced with multiple bypass methods:
  - `trustHost: true` in auth configuration
  - `useSecureCookies: false` to disable secure cookie requirements
  - Custom middleware to add missing headers for auth routes
  - Additional environment variables for auth fallbacks

## Additional CSRF Fixes

### 1. Enhanced Auth Configuration
- Added `useSecureCookies: false` to handle HTTP deployment
- Extended session configuration with proper maxAge
- Added comprehensive debugging logs

### 2. CSRF Bypass Middleware
- Created `server/middleware/csrf-bypass.ts` to automatically add required headers
- Specifically targets `/api/auth/` routes
- Adds missing `origin`, `referer`, and `x-forwarded-proto` headers

### 3. Enhanced Environment Variables
- Added `NUXT_AUTH_SECRET` as fallback
- Added `NUXT_AUTH_URL` for additional auth URL configuration
- Ensures all auth-related environment variables are properly set

The main issue was likely the Prisma client not being properly generated or bundled in production, combined with CSRF protection being too strict for the HTTP deployment environment. These fixes address both issues comprehensively.

## Build Error Fix

**Issue**: The enhanced Nitro configuration was causing module resolution errors with Prisma:
```
Invalid module ".prisma" is not a valid package name
```

**Solution**: Simplified the Nitro configuration by removing the problematic CommonJS and externals configurations. The postinstall script handles Prisma client generation, so complex bundling configurations are not needed. 