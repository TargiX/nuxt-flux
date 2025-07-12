<template>
  <div class="model-picker-container">
    <Dropdown
      v-model="selectedModel"
      :options="modelOptions"
      option-label="label"
      option-value="value"
      placeholder="Select Model"
      class="model-picker-dropdown"
      :class="{ 'model-picker-compact': compact }"
      @change="handleModelChange"
    >
      <template #value="{ value }">
        <div v-if="value" class="flex items-center gap-2">
          <i :class="getProviderIcon(value)" class="text-sm"></i>
          <span class="text-sm">{{ getModelDisplayName(value) }}</span>
        </div>
        <span v-else class="text-sm opacity-75">Select Model</span>
      </template>
      <template #option="{ option }">
        <div class="flex items-center gap-2 p-2">
          <i :class="option.icon" class="text-sm"></i>
          <div class="flex flex-col">
            <span class="font-medium">{{ option.label }}</span>
            <span class="text-xs opacity-75">{{ option.description }}</span>
          </div>
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Dropdown from 'primevue/dropdown'
import { getModelDisplayOptions } from '~/services/modelConfigService'

interface ModelOption {
  value: string
  label: string
  description: string
  icon: string
  provider: string
}

interface Props {
  modelValue: string
  compact?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const emit = defineEmits<Emits>()

const selectedModel = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value)
})

// Get available models from the configuration service
const modelOptions = ref<ModelOption[]>(getModelDisplayOptions())

function getProviderIcon(modelValue: string): string {
  const model = modelOptions.value.find(m => m.value === modelValue)
  return model?.icon || 'pi pi-image'
}

function getModelDisplayName(modelValue: string): string {
  const model = modelOptions.value.find(m => m.value === modelValue)
  return model?.label || modelValue
}

function handleModelChange(event: any) {
  emit('change', event.value)
}
</script>

<style scoped lang="scss">
.model-picker-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.model-picker-dropdown {
  min-width: 200px;
  
  &.model-picker-compact {
    min-width: 150px;
  }
}

// Custom icons for providers not in PrimeVue
:deep(.pi-openai)::before {
  content: '🤖';
}

:deep(.pi-google)::before {
  content: '🔍';
}

:deep(.pi-bolt)::before {
  content: '⚡';
}

:deep(.pi-palette)::before {
  content: '🎨';
}
</style>