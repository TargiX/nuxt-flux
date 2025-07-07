export interface ContextMenuCategory {
  category: string
  items: string[]
}

export async function getContextMenuOptions(text: string): Promise<ContextMenuCategory[]> {
  try {
    const response = await fetch('/api/context-menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Context menu API error (${response.status}): ${errText}`)
    }
    const data = (await response.json()) as { categories: ContextMenuCategory[] }
    return data.categories
  } catch (error) {
    console.error('Error fetching context menu options:', error)
    return []
  }
}
