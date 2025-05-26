# Deployment Fix Guide

## Changes Made

### 1. Updated package.json postinstall script
- Added `prisma generate` to the postinstall script
- This ensures Prisma client is generated automatically during `pnpm install`

### 2. Enhanced Nitro configuration in nuxt.config.ts
- Added `experimental.wasm: true` for better Prisma support
- Updated CommonJS plugin to include both paths: `/node_modules/@prisma/client/` and `/generated/prisma/client/`
- Added `externals.inline: ['@prisma/client']` to properly bundle Prisma

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
- **CSRF Protection**: Already configured with `trustHost: true`

The main issue was likely the Prisma client not being properly generated or bundled in production, which is now fixed with the postinstall script and enhanced Nitro configuration. 