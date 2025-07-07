<template>
  <div class="action-menu-container" @click.stop>
    <Button
      icon="pi pi-ellipsis-v"
      :class="['p-button-sm p-button-rounded', buttonClass, buttonStyleClass]"
      aria-haspopup="true"
      :aria-controls="menuId"
      @click="onButtonClick"
    />
    <Menu :id="menuId" ref="menuRef" :model="items" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Menu from 'primevue/menu'

const props = withDefaults(
  defineProps<{
    items: any[]
    menuId?: string
    buttonClass?: string
    buttonType?: 'text' | 'solid'
  }>(),
  {
    buttonType: 'text',
  }
)

const emit = defineEmits<{ (e: 'open', event: MouseEvent): void }>()

const buttonStyleClass = computed(() => {
  return props.buttonType === 'text' ? 'p-button-text' : 'p-button-secondary'
})

const menuRef = ref()
const menuId = props.menuId || `menu_${Math.random().toString(36).slice(2, 8)}`

function onButtonClick(event: MouseEvent) {
  emit('open', event)
  menuRef.value?.toggle(event)
}
</script>

<style scoped>
.action-menu-container {
  position: relative;
}
</style>
