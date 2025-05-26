export default defineEventHandler(async (event) => {
  // Only apply to auth routes
  if (event.node.req.url?.startsWith('/api/auth/')) {
    console.log('[Auth CSRF Bypass] Processing auth route:', event.node.req.url)
    
    // Override the request method to bypass CSRF for POST requests
    if (event.node.req.method === 'POST') {
      console.log('[Auth CSRF Bypass] POST request detected, applying CSRF bypass')
      
      // Set all necessary headers for CSRF bypass
      const baseUrl = 'http://5.161.248.184:3000'
      
      // Ensure all required headers are present
      event.node.req.headers.origin = baseUrl
      event.node.req.headers.referer = baseUrl
      event.node.req.headers.host = '5.161.248.184:3000'
      event.node.req.headers['x-forwarded-proto'] = 'http'
      event.node.req.headers['x-forwarded-host'] = '5.161.248.184:3000'
      
      // Add CSRF token bypass headers
      event.node.req.headers['x-auth-return-redirect'] = '1'
      event.node.req.headers['content-type'] = 'application/x-www-form-urlencoded'
      
      console.log('[Auth CSRF Bypass] Headers set for CSRF bypass')
    }
  }
}) 