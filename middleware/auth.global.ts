import { watch } from 'vue'
// verifyClientSession is not directly importable here without module augmentation or specific export changes
// We will rely on useAuth() and its reactive properties.

export default defineNuxtRouteMiddleware(async (to) => {
  const { status, session } = useAuth()

  // Public routes: Allow access directly
  if (['/login', '/register', '/forgot-password', '/reset-password'].includes(to.path)) {
    return
  }

  /* ── Server-Side Rendering (SSR) ──────────────────────────────── */
  if (import.meta.server) {
    // On SSR, useAuth() attempts to load session from cookie.
    // If no session is found (session.value is null) and status isn't already 'authenticated',
    // then redirect to login.
    if (!session.value && status.value !== 'authenticated') {
      // Only add redirect parameter if not going to home page
      const redirectParam =
        to.fullPath !== '/' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
      return navigateTo(`/login${redirectParam}`)
    }
    return // Proceed with navigation
  }

  /* ── Client-Side Rendering (CSR) ──────────────────────────────── */
  // If status is 'loading', it means useAuth is trying to determine auth state.
  // Wait for this to complete.
  if (status.value === 'loading') {
    await new Promise<void>((resolve) => {
      // Watch for status to change from 'loading'
      const unwatch = watch(
        status,
        (newStatus) => {
          if (newStatus !== 'loading') {
            unwatch() // Stop watching once resolved
            resolve()
          }
        },
        { immediate: true }
      ) // immediate:true ensures it runs if status is already not 'loading'
    })
  }

  // After any loading, if status is not 'authenticated', redirect to login.
  if (status.value !== 'authenticated') {
    // Only add redirect parameter if not going to home page
    const redirectParam = to.fullPath !== '/' ? `?redirect=${encodeURIComponent(to.fullPath)}` : ''
    return navigateTo(`/login${redirectParam}`)
  }

  // No explicit return needed here; if not redirected, Nuxt proceeds.
})
