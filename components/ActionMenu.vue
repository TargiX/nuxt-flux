<template>
  <div class="action-menu-container" @click.stop>
    <Button
      icon="pi pi-ellipsis-v"
      :class="['p-button-text p-button-sm p-button-rounded', buttonClass]"
      @click="onButtonClick"
      aria-haspopup="true"
      :aria-controls="menuId"
    />
    <Menu ref="menuRef" :id="menuId" :model="items" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Button from 'primevue/button';
import Menu from 'primevue/menu';

const props = defineProps<{
  items: any[];
  menuId?: string;
  buttonClass?: string;
}>();

const emit = defineEmits<{ (e: 'open', event: MouseEvent): void }>();

const menuRef = ref();
const menuId = props.menuId || `menu_${Math.random().toString(36).slice(2,8)}`;

function onButtonClick(event: MouseEvent) {
  emit('open', event);
  menuRef.value?.toggle(event);
}
</script>

<style scoped>
.action-menu-container {
  position: relative;
}
</style>
