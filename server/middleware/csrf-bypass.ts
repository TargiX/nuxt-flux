export default defineEventHandler(async (event) => {
  // Only apply to auth routes
  if (event.node.req.url?.startsWith('/api/auth/')) {
    console.log('[CSRF Bypass] Processing auth route:', event.node.req.url)
    console.log('[CSRF Bypass] Original headers:', JSON.stringify(event.node.req.headers))
    
    // Set headers to bypass CSRF protection
    if (event.node.req.headers) {
      const baseUrl = 'http://5.161.248.184:3000'
      
      // Add origin header if missing (common CSRF bypass)
      if (!event.node.req.headers.origin) {
        event.node.req.headers.origin = baseUrl
        console.log('[CSRF Bypass] Added origin header:', baseUrl)
      }
      
      // Add referer header if missing
      if (!event.node.req.headers.referer) {
        event.node.req.headers.referer = baseUrl
        console.log('[CSRF Bypass] Added referer header:', baseUrl)
      }
      
      // Set X-Forwarded-Proto for HTTPS detection
      if (!event.node.req.headers['x-forwarded-proto']) {
        event.node.req.headers['x-forwarded-proto'] = 'http'
        console.log('[CSRF Bypass] Added x-forwarded-proto: http')
      }
      
      // Add host header if missing
      if (!event.node.req.headers.host) {
        event.node.req.headers.host = '5.161.248.184:3000'
        console.log('[CSRF Bypass] Added host header: 5.161.248.184:3000')
      }
      
      // Add x-forwarded-host for additional CSRF bypass
      if (!event.node.req.headers['x-forwarded-host']) {
        event.node.req.headers['x-forwarded-host'] = '5.161.248.184:3000'
        console.log('[CSRF Bypass] Added x-forwarded-host: 5.161.248.184:3000')
      }
      
      console.log('[CSRF Bypass] Final headers:', JSON.stringify(event.node.req.headers))
    }
  }
}) 