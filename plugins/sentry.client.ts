import * as Sentry from '@sentry/nuxt'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  // Only initialize if we have a DSN
  if (!config.public.sentry?.dsn) {
    console.log('[Sentry] No DSN provided, skipping initialization')
    return
  }

  Sentry.init({
    dsn: config.public.sentry.dsn,
    environment: config.public.sentry.environment || 'development',

    // Performance Monitoring
    tracesSampleRate: config.public.sentry.environment === 'production' ? 0.1 : 1.0,

    // Session Replay (great for understanding user behavior)
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    // Integrations
    integrations: [
      // Captures console.error() statements
      Sentry.captureConsoleIntegration({ levels: ['error', 'warn'] }),

      // Tracks user interactions
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Filter out noise
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random browser errors
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      // Network errors that are expected
      /NetworkError/,
      /Failed to fetch/,
    ],

    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (config.public.sentry.environment === 'development') {
        console.log('[Sentry] Skipping event in development:', event.message || event.exception)
        return null
      }

      // Add user context if available
      const { session } = useAuth()
      if (session.value?.user) {
        event.user = {
          id: session.value.user.id,
          email: session.value.user.email || undefined,
        }
      }

      return event
    },
  })

  // Add custom error handler for better error tracking
  nuxtApp.vueApp.config.errorHandler = (error, instance, info) => {
    console.error('[Vue Error]', error, info)

    // Send to Sentry with additional context
    Sentry.withScope((scope) => {
      scope.setContext('vue', {
        componentName: instance?.$options.name || 'Unknown',
        propsData: instance?.$props,
        info,
      })
      Sentry.captureException(error)
    })
  }

  // Track route changes for better user journey understanding
  nuxtApp.hook('page:finish', () => {
    Sentry.addBreadcrumb({
      category: 'navigation',
      message: `Navigated to ${useRoute().fullPath}`,
      level: 'info',
    })
  })
})
