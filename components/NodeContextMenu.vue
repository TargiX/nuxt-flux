<template>
  <div
    v-if="visible"
    class="node-context-menu"
    :style="{ top: y + 'px', left: x + 'px' }"
    @click.stop
  >
    <ul>
      <li v-for="item in menuItems" :key="item.label" @click="handleItemClick(item)">
        <i :class="item.icon"></i>
        <span>{{ item.label }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';

interface MenuItem {
  label: string;
  icon?: string;
  action: (nodeId: string) => void;
}

interface Props {
  nodeId: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits(['menuAction']);

const visible = ref(false);
const x = ref(0);
const y = ref(0);

const menuItems = ref<MenuItem[]>([
  { label: 'Test Action 1', icon: 'pi pi-bolt', action: (nodeId) => console.log('Test Action 1 on node:', nodeId) },
  { label: 'Test Action 2', icon: 'pi pi-cog', action: (nodeId) => console.log('Test Action 2 on node:', nodeId) },
  { label: 'Inspect Node', icon: 'pi pi-search', action: (nodeId) => console.log('Inspect node:', nodeId) },
]);

function show(event: MouseEvent) {
  x.value = event.clientX;
  y.value = event.clientY;
  visible.value = true;
  // Prevent the browser's default context menu
  event.preventDefault();
  document.addEventListener('click', handleClickOutside, true);
}

function hide() {
  visible.value = false;
  document.removeEventListener('click', handleClickOutside, true);
}

function handleItemClick(item: MenuItem) {
  if (props.nodeId) {
    item.action(props.nodeId);
    emit('menuAction', { action: item.label, nodeId: props.nodeId });
  }
  hide();
}

function handleClickOutside(event: MouseEvent) {
  // Check if the click is outside the context menu
  const menuElement = document.querySelector('.node-context-menu');
  if (menuElement && !menuElement.contains(event.target as Node)) {
    hide();
  }
}

onMounted(() => {
  // Component is ready
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true);
});

// Expose methods to parent
defineExpose({
  show,
  hide,
});
</script>

<style scoped lang="scss">
.node-context-menu {
  position: fixed;
  background-color: #2a2a2a; // Dark background
  border: 1px solid #444; // Slightly lighter border
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 180px;
  padding: 8px 0;
  color: #e0e0e0; // Light text

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background-color 0.2s ease, color 0.2s ease;

      &:hover {
        background-color: #383838; // Darker hover
        color: #ffffff; // Brighter text on hover
      }

      i {
        margin-right: 10px;
        color: #9e9e9e; // Icon color
      }
      
      &:hover i {
        color: #ffffff; // Brighter icon on hover
      }
    }
  }
}
</style> 