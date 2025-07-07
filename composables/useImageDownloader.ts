import { useToast } from 'primevue/usetoast'

export function useImageDownloader() {
  const toast = useToast()

  async function downloadImage(imageUrl: string, promptText: string | null | undefined) {
    if (!imageUrl) {
      toast.add({
        severity: 'warn',
        summary: 'No Image',
        detail: 'No image URL provided to download.',
        life: 3000,
      })
      return
    }

    try {
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = url

      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
      const safePrompt = promptText
        ? promptText
            .slice(0, 50)
            .replace(/[^a-zA-Z0-9_\s-]/g, '')
            .replace(/\s+/g, '_')
        : ''

      const filename = safePrompt
        ? `dreamseed-${safePrompt}-${timestamp}.png`
        : `dreamseed-image-${timestamp}.png`

      anchor.download = filename

      document.body.appendChild(anchor)
      anchor.click()

      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)

      // Optional: subtle success feedback if not relying on browser default
      // toast.add({ severity: 'success', summary: 'Download Started', detail: 'Image download has started.', life: 3000 });
    } catch (error: any) {
      console.error('Failed to download image:', error)
      toast.add({
        severity: 'error',
        summary: 'Download Failed',
        detail: error.message || 'Could not download image. Please try again.',
        life: 5000,
      })
    }
  }

  return {
    downloadImage,
  }
}
