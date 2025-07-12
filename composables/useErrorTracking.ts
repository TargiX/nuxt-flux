import * as Sentry from '@sentry/nuxt'
import { useToast } from 'primevue/usetoast'

export interface ErrorTrackingOptions {
  showToast?: boolean
  context?: Record<string, any>
  level?: 'error' | 'warning' | 'info'
  fingerprint?: string[]
}

export const useErrorTracking = () => {
  const toast = useToast()

  /**
   * Track an error with Sentry and optionally show a user-friendly toast
   */
  const trackError = (
    error: Error | string,
    userMessage?: string,
    options: ErrorTrackingOptions = {}
  ) => {
    const { showToast = true, context = {}, level = 'error', fingerprint } = options

    // Convert string to Error object
    const errorObj = error instanceof Error ? error : new Error(error)

    // Log to console in development
    console.error('[Error Tracked]', errorObj, context)

    // Send to Sentry with context
    Sentry.withScope((scope) => {
      // Add custom context
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })

      // Set level
      scope.setLevel(level as Sentry.SeverityLevel)

      // Set fingerprint for grouping
      if (fingerprint) {
        scope.setFingerprint(fingerprint)
      }

      // Capture the exception
      Sentry.captureException(errorObj)
    })

    // Show user-friendly toast if enabled
    if (showToast && userMessage) {
      toast.add({
        severity: level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'info',
        summary: level === 'error' ? 'Error' : level === 'warning' ? 'Warning' : 'Info',
        detail: userMessage,
        life: 5000,
      })
    }
  }

  /**
   * Track API errors with additional context
   */
  const trackApiError = (endpoint: string, error: any, userMessage?: string) => {
    const context = {
      api: {
        endpoint,
        method: error.response?.config?.method || 'unknown',
        status: error.response?.status || 'unknown',
        statusText: error.response?.statusText || 'unknown',
        data: error.response?.data || null,
      },
    }

    // Determine user message based on status code
    const defaultMessage =
      userMessage ||
      (() => {
        const status = error.response?.status
        if (status === 401) return 'Please log in to continue'
        if (status === 403) return "You don't have permission to do this"
        if (status === 404) return 'The requested resource was not found'
        if (status === 429) return 'Too many requests. Please try again later'
        if (status >= 500) return 'Server error. Please try again later'
        return 'An error occurred. Please try again'
      })()

    trackError(error, defaultMessage, {
      context,
      fingerprint: [`api-error-${endpoint}-${error.response?.status || 'unknown'}`],
    })
  }

  /**
   * Track user actions for better insights
   */
  const trackUserAction = (action: string, category: string, data?: Record<string, any>) => {
    Sentry.addBreadcrumb({
      message: action,
      category: `user.${category}`,
      level: 'info',
      data,
      timestamp: Date.now() / 1000,
    })

    // Log in development
    if (import.meta.dev) {
      console.log('[User Action]', { action, category, data })
    }
  }

  /**
   * Track performance metrics
   */
  const trackPerformance = (operation: string, duration: number, data?: Record<string, any>) => {
    // Add performance breadcrumb
    Sentry.addBreadcrumb({
      message: `${operation} completed`,
      category: 'performance',
      level: 'info',
      data: {
        duration,
        ...data,
      },
    })

    // Log slow operations
    if (duration > 3000) {
      trackError(`Slow operation: ${operation} took ${duration}ms`, undefined, {
        level: 'warning',
        context: { performance: { operation, duration, ...data } },
        showToast: false,
      })
    }
  }

  /**
   * Wrap async functions with error tracking
   */
  const withErrorTracking = async <T>(
    fn: () => Promise<T>,
    errorMessage: string,
    context?: Record<string, any>
  ): Promise<T | null> => {
    try {
      return await fn()
    } catch (error) {
      trackError(error as Error, errorMessage, { context })
      return null
    }
  }

  return {
    trackError,
    trackApiError,
    trackUserAction,
    trackPerformance,
    withErrorTracking,
  }
}
