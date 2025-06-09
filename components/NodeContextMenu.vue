<template>
  <div
    
    class="node-context-menu"
    
    :style="{ top: y + 'px', left: x + 'px' }"
    @click.stop
  >
    <TieredMenu v-if="visible" :autoZIndex="true" :baseZIndex="9999" appendTo="body" ref="menu" :model="menuModel" />
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue';
import TieredMenu from 'primevue/tieredmenu';
import { getContextMenuOptions } from '~/services/contextMenuService';

interface CmdPayload { category: string; action: string; nodeId: string; }
// Props from parent component
const props = defineProps<{ nodeId: string | null }>();
// Emit event when menu item selected
const emit = defineEmits<{ (e: 'menuAction', payload: CmdPayload): void }>();

// Position and visibility tracking
const visible = ref(false);
const x = ref(0);
const y = ref(0);

// Define static menu model
const staticMenu = [
  {
    label: 'Attributes', icon: 'pi pi-fw pi-list', items: [
      { label: 'Role', icon: 'pi pi-fw pi-user', command: () => onSelect('Attributes', 'Role') },
      { label: 'Color', icon: 'pi pi-fw pi-palette', command: () => onSelect('Attributes', 'Color') },
      { label: 'Size', icon: 'pi pi-fw pi-arrows-alt', command: () => onSelect('Attributes', 'Size') }
    ]
  },
  {
    label: 'Activity', icon: 'pi pi-fw pi-refresh', items: [
      { label: 'Run', icon: 'pi pi-fw pi-play', command: () => onSelect('Activity', 'Run') },
      { label: 'Jump', icon: 'pi pi-fw pi-arrow-up', command: () => onSelect('Activity', 'Jump') }
    ]
  },
  {
    label: 'Aesthetics', icon: 'pi pi-fw pi-star', items: [
      { label: 'Shiny', icon: 'pi pi-fw pi-globe', command: () => onSelect('Aesthetics', 'Shiny') },
      { label: 'Matte', icon: 'pi pi-fw pi-image', command: () => onSelect('Aesthetics', 'Matte') }
    ]
  },
   {
    label: 'Mood', icon: 'pi pi-fw pi-smile', items: [
      { label: 'Happy', icon: 'pi pi-fw pi-thumbs-up', command: () => onSelect('Mood', 'Happy') },
      { label: 'Sad', icon: 'pi pi-fw pi-thumbs-down', command: () => onSelect('Mood', 'Sad') }
    ]
  },
  {
    label: 'Setting', icon: 'pi pi-fw pi-map', items: [
      { label: 'Forest', icon: 'pi pi-fw pi-tree', command: () => onSelect('Setting', 'Forest') },
      { label: 'City', icon: 'pi pi-fw pi-building', command: () => onSelect('Setting', 'City') }
    ]
  }
];

const menuModel = ref([...staticMenu]);

async function loadDynamicMenu(text: string | null) {
  if (!text) return;
  const dynamic = await getContextMenuOptions(text);
  const dynamicModel = dynamic.map(cat => ({
    label: cat.category,
    icon: 'pi pi-fw pi-compass',
    items: cat.items.map(item => ({
      label: item,
      icon: 'pi pi-fw pi-bolt',
      command: () => onSelect(cat.category, item)
    }))
  }));
  menuModel.value = [...staticMenu, ...dynamicModel];
}

// Handler when a submenu is selected
function onSelect(category: string, action: string) {
  if (props.nodeId) {
    emit('menuAction', { category, action, nodeId: props.nodeId });
  }
  hide();
}

function hide() {
  visible.value = false;
  document.removeEventListener('click', handleClickOutside, true);
}

function handleClickOutside(event: MouseEvent) {
  const menuElement = document.querySelector('.node-context-menu');
  if (menuElement && !menuElement.contains(event.target as Node)) {
    hide();
  }
}

// Expose show and hide for parent components
const menu = ref<InstanceType<typeof TieredMenu> | null>(null);
defineExpose({
  async show(event: MouseEvent, text: string | null) {
    menuModel.value = [...staticMenu];
    await loadDynamicMenu(text);
    x.value = event.clientX;
    y.value = event.clientY;
    visible.value = true;
    event.preventDefault();
    document.addEventListener('click', handleClickOutside, true);
  },
  hide
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true);
});
</script>

<style scoped>
.node-context-menu {
  position: fixed;
  z-index: 9999;
}
</style> 