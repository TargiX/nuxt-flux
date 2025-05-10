export default defineNuxtRouteMiddleware(async (to, from) => {
  // Get authentication status
  const { status } = useAuth();

  // Allow navigation to login and register pages regardless of auth status
  if (to.path === '/login' || to.path === '/register') {
    return; // Don't do anything, let the page-specific meta handle auth users
  }

  // If user is not authenticated and not trying to access login/register, redirect to login
  if (status.value === 'unauthenticated') {
    // console.log('Global auth middleware: User unauthenticated, redirecting to /login from', to.path);
    return navigateTo('/login');
  }
  
  // console.log('Global auth middleware: User status:', status.value, 'at path:', to.path);
}); 