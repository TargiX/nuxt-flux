<template>
  <div class="node-context-menu" :style="{ top: y + 'px', left: x + 'px' }" @click.stop>
    <TieredMenu
      v-if="visible"
      ref="menu"
      :auto-z-index="true"
      :base-z-index="9999"
      append-to="body"
      :model="menuModel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'
import TieredMenu from 'primevue/tieredmenu'
import { getContextMenuOptions } from '~/services/contextMenuService'

interface CmdPayload {
  category: string
  action: string
  nodeId: string
}
// Props from parent component
const props = defineProps<{ nodeId: string | null }>()
// Emit event when menu item selected
const emit = defineEmits<{ (e: 'menuAction', payload: CmdPayload): void }>()

// Position and visibility tracking
const visible = ref(false)
const x = ref(0)
const y = ref(0)
const isLoadingDynamic = ref(false)

// Define static menu model
const staticMenu = [
  {
    label: 'Attributes',
    icon: 'pi pi-fw pi-list',
    items: [
      { label: 'Role', icon: 'pi pi-fw pi-user', command: () => onSelect('Attributes', 'Role') },
      {
        label: 'Color',
        icon: 'pi pi-fw pi-palette',
        command: () => onSelect('Attributes', 'Color'),
      },
      {
        label: 'Size',
        icon: 'pi pi-fw pi-arrows-alt',
        command: () => onSelect('Attributes', 'Size'),
      },
    ],
  },
  {
    label: 'Activity',
    icon: 'pi pi-fw pi-refresh',
    items: [
      { label: 'Run', icon: 'pi pi-fw pi-play', command: () => onSelect('Activity', 'Run') },
      { label: 'Jump', icon: 'pi pi-fw pi-arrow-up', command: () => onSelect('Activity', 'Jump') },
    ],
  },
  {
    label: 'Aesthetics',
    icon: 'pi pi-fw pi-star',
    items: [
      { label: 'Shiny', icon: 'pi pi-fw pi-globe', command: () => onSelect('Aesthetics', 'Shiny') },
      { label: 'Matte', icon: 'pi pi-fw pi-image', command: () => onSelect('Aesthetics', 'Matte') },
    ],
  },
  {
    label: 'Mood',
    icon: 'pi pi-fw pi-smile',
    items: [
      { label: 'Happy', icon: 'pi pi-fw pi-thumbs-up', command: () => onSelect('Mood', 'Happy') },
      { label: 'Sad', icon: 'pi pi-fw pi-thumbs-down', command: () => onSelect('Mood', 'Sad') },
    ],
  },
  {
    label: 'Setting',
    icon: 'pi pi-fw pi-map',
    items: [
      { label: 'Forest', icon: 'pi pi-fw pi-tree', command: () => onSelect('Setting', 'Forest') },
      { label: 'City', icon: 'pi pi-fw pi-building', command: () => onSelect('Setting', 'City') },
    ],
  },
]

// Create loading indicator menu item
const createLoadingItem = () => ({
  label: 'Loading AI suggestions...',
  icon: 'pi pi-fw pi-spinner',
  disabled: true,
  class: 'loading-item',
  style: {
    borderTop: '1px solid var(--surface-border)',
    marginTop: '8px',
    paddingTop: '8px',
    fontStyle: 'italic',
    opacity: '0.8',
  },
})

const menuModel = ref([...staticMenu])

// Cache for dynamic menu items to avoid redundant API calls
const dynamicMenuCache = new Map<string, any[]>()
let currentLoadingText: string | null = null

async function loadDynamicMenu(text: string | null) {
  if (!text || text.trim().length === 0) return

  // Check cache first
  if (dynamicMenuCache.has(text)) {
    const cachedDynamic = dynamicMenuCache.get(text)!
    menuModel.value = [...staticMenu, ...cachedDynamic]
    return
  }

  // Prevent duplicate requests for the same text
  if (currentLoadingText === text) return
  currentLoadingText = text

  // Add loading indicator
  isLoadingDynamic.value = true
  menuModel.value = [...staticMenu, createLoadingItem()]

  try {
    const dynamic = await getContextMenuOptions(text)
    const dynamicModel = dynamic.map((cat) => ({
      label: cat.category,
      icon: 'pi pi-fw pi-compass',
      items: cat.items.map((item) => ({
        label: item,
        icon: 'pi pi-fw pi-bolt',
        command: () => onSelect(cat.category, item),
      })),
    }))

    // Cache the result for future use
    dynamicMenuCache.set(text, dynamicModel)

    // Only update if we're still loading the same text (prevent race conditions)
    if (currentLoadingText === text) {
      menuModel.value = [...staticMenu, ...dynamicModel]
    }
  } catch (error) {
    console.error('Error loading dynamic menu items:', error)
    // Only show error state if we're still loading the same text
    if (currentLoadingText === text) {
      const errorItem = {
        label: 'Failed to load AI suggestions',
        icon: 'pi pi-fw pi-exclamation-triangle',
        disabled: true,
        class: 'error-item',
        style: {
          borderTop: '1px solid var(--surface-border)',
          marginTop: '8px',
          paddingTop: '8px',
          fontStyle: 'italic',
          opacity: '0.7',
          color: 'var(--red-500)',
        },
      }
      menuModel.value = [...staticMenu, errorItem]
    }
  } finally {
    if (currentLoadingText === text) {
      isLoadingDynamic.value = false
      currentLoadingText = null
    }
  }
}

// Handler when a submenu is selected
function onSelect(category: string, action: string) {
  if (props.nodeId) {
    emit('menuAction', { category, action, nodeId: props.nodeId })
  }
  hide()
}

function hide() {
  visible.value = false
  isLoadingDynamic.value = false
  currentLoadingText = null
  document.removeEventListener('click', handleClickOutside, true)
}

function handleClickOutside(event: MouseEvent) {
  const menuElement = document.querySelector('.node-context-menu')
  if (menuElement && !menuElement.contains(event.target as Node)) {
    hide()
  }
}

// Clear cache for dynamic menu items
function clearCache() {
  dynamicMenuCache.clear()
}

// Expose show and hide for parent components
const menu = ref<InstanceType<typeof TieredMenu> | null>(null)
defineExpose({
  show(event: MouseEvent, text: string | null) {
    // Show menu immediately with static items
    menuModel.value = [...staticMenu]
    x.value = event.clientX
    y.value = event.clientY
    visible.value = true
    event.preventDefault()
    document.addEventListener('click', handleClickOutside, true)

    // Load dynamic items asynchronously (non-blocking)
    loadDynamicMenu(text)
  },
  hide,
  clearCache,
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true)
})
</script>

<style scoped>
.node-context-menu {
  position: fixed;
  z-index: 9999;
}

/* Custom styles for loading and error indicators */
:deep(.p-menuitem.loading-item .p-menuitem-text),
:deep(.p-menuitem.error-item .p-menuitem-text) {
  font-style: italic !important;
  opacity: 0.8 !important;
}

:deep(.p-menuitem.loading-item),
:deep(.p-menuitem.error-item) {
  border-top: 1px solid var(--surface-border) !important;
  margin-top: 8px !important;
  padding-top: 8px !important;
}

:deep(.p-menuitem.error-item .p-menuitem-text) {
  color: var(--red-500) !important;
}

/* Spinner animation */
:deep(.pi-spinner) {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dynamic menu items styling */
:deep(.p-menuitem-link) {
  transition: background-color 0.2s ease;
}

:deep(.p-menuitem-link:hover) {
  background-color: var(--highlight-bg);
}

/* Ensure proper spacing for dynamic categories */
:deep(.p-submenu-list) {
  min-width: 200px;
}
</style>
