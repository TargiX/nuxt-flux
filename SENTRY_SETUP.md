# Sentry Error Tracking Setup

## Overview

This app uses Sentry for error tracking and user behavior monitoring. Sentry helps you understand:

- What errors users encounter
- How users interact with your app
- Performance bottlenecks
- User journeys that lead to problems

## Quick Setup (Free Tier)

### 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account
3. Create a new project:
   - Platform: `Vue` or `JavaScript`
   - Project name: `nuxt-flux` (or your preference)

### 2. Get Your DSN

After creating the project, Sentry will show you a DSN (Data Source Name) that looks like:

```
https://abc123@o123456.ingest.sentry.io/1234567
```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Sentry Error Tracking
SENTRY_DSN="your-dsn-here"
SENTRY_ORG="your-org-name"  # Optional, for source maps
SENTRY_PROJECT="nuxt-flux"   # Optional, for source maps
```

### 4. Test It Works

1. Start your dev server: `pnpm dev`
2. Open browser console
3. You should see: `[Sentry] No DSN provided, skipping initialization` (if no DSN)
4. Or no message if properly configured

## What Gets Tracked

### Automatic Tracking

- JavaScript errors
- Network failures
- Slow operations (>3 seconds)
- Page navigation
- Console errors and warnings

### Custom Tracking

The app tracks specific user actions:

- Image generation attempts
- Dream saving/loading
- Tag selections
- API errors with context

### Privacy Considerations

- User emails are associated with errors (for logged-in users)
- No passwords or sensitive data are sent
- Session replays capture user interactions (10% sample rate)

## Using Error Data

### Finding Common Issues

1. Go to your Sentry dashboard
2. Look at "Issues" to see recurring errors
3. Check "User Feedback" for context

### Understanding User Behavior

1. Check "Replays" to see actual user sessions
2. Look at "Performance" for slow operations
3. Review "Discover" for custom queries

### Example Insights You'll Get

- "Users from mobile devices get more network errors"
- "Image generation fails 20% of the time with specific prompts"
- "Users abandon the app after encountering login errors"
- "The tag selection takes 5+ seconds for some users"

## Development vs Production

### Development Mode

- Errors are logged to console but NOT sent to Sentry
- Useful for local debugging without noise

### Production Mode

- All errors are sent to Sentry
- 10% of sessions are recorded
- Performance monitoring active

## Advanced Configuration

### Adjusting Sample Rates

In `plugins/sentry.client.ts`:

```typescript
// Reduce performance monitoring in production
tracesSampleRate: 0.1, // 10% of transactions

// Increase session recordings
replaysSessionSampleRate: 0.2, // 20% of sessions
```

### Filtering Sensitive Data

Add to `beforeSend` in the plugin:

```typescript
// Remove sensitive data
if (event.request?.cookies) {
  delete event.request.cookies
}
```

### Custom Error Context

Use the error tracking composable:

```typescript
const { trackError } = useErrorTracking()

trackError(new Error('Custom error'), 'User-friendly message', {
  context: {
    customData: 'value',
  },
})
```

## Monitoring Checklist

Weekly tasks:

- [ ] Check for new error types
- [ ] Review slowest operations
- [ ] Watch user session replays
- [ ] Look for error spikes

Monthly tasks:

- [ ] Analyze user journeys to errors
- [ ] Review performance trends
- [ ] Update error handling based on data
- [ ] Clean up resolved issues

## Free Tier Limits

Sentry's free tier includes:

- 5,000 errors/month
- 10,000 performance events/month
- 50 session replays/month
- 1 team member

This is plenty for beta testing with 10-50 users.

## Getting Help

- Sentry Docs: https://docs.sentry.io/
- Vue-specific guide: https://docs.sentry.io/platforms/javascript/guides/vue/
- Support: https://sentry.io/support/
