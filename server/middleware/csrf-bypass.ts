export default defineEventHandler(async (event) => {
  // Only apply to auth routes
  if (event.node.req.url?.startsWith('/api/auth/')) {
    // Set headers to bypass CSRF protection
    if (event.node.req.headers) {
      // Add origin header if missing (common CSRF bypass)
      if (!event.node.req.headers.origin) {
        event.node.req.headers.origin = event.node.req.headers.host || 'http://5.161.248.184:3000'
      }
      
      // Add referer header if missing
      if (!event.node.req.headers.referer) {
        event.node.req.headers.referer = event.node.req.headers.origin || 'http://5.161.248.184:3000'
      }
      
      // Set X-Forwarded-Proto for HTTPS detection
      if (!event.node.req.headers['x-forwarded-proto']) {
        event.node.req.headers['x-forwarded-proto'] = 'http'
      }
    }
  }
}) 