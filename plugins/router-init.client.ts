export default defineNuxtPlugin({
  name: 'router-init',
  setup() {
    // Ensure router is available before other plugins try to access it
    const router = useRouter()

    // Wait for router to be ready
    return router
      .isReady()
      .then(() => {
        console.log('[Router Init] Router is ready')
      })
      .catch((error) => {
        console.error('[Router Init] Router initialization failed:', error)
      })
  },
})
