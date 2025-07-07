<template>
  <div ref="container" class="zone-selector">
    <SelectButton
      :model-value="modelValue"
      :options="options"
      :option-label="props.optionLabel"
      :option-value="props.optionValue"
      severity="primary"
      class="zone-buttons"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <template #option="slotProps">
        <div :class="['zone-button-content', `zone-${slotProps.option.name.toLowerCase()}`]">
          {{ slotProps.option.name }} ({{ slotProps.option.count }})
        </div>
      </template>
    </SelectButton>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'

interface ZoneOption {
  name: string
  count: number
}

const props = defineProps<{
  modelValue: string // Stays as string
  options: ZoneOption[] // Now expects array of objects
  optionLabel?: string // For PrimeVue SelectButton
  optionValue?: string // For PrimeVue SelectButton
}>()

defineEmits(['update:modelValue'])

const container = ref<HTMLElement | null>(null)

// Add custom attributes to buttons after rendering
onMounted(() => {
  addZoneAttributes()
})

// Re-apply attributes when options change
watch(
  () => props.options,
  () => {
    // Use nextTick to ensure DOM is updated before trying to find buttons
    nextTick(addZoneAttributes)
  },
  { deep: true }
) // Add deep watch if options objects might change internally without array replacement

function addZoneAttributes() {
  if (!container.value) return

  const buttons = container.value.querySelectorAll('.zone-buttons button') // Be more specific with selector
  buttons.forEach((button, index) => {
    if (index < props.options.length && props.options[index]) {
      button.setAttribute('option-zone', props.options[index].name)
    }
  })
}
</script>

<style lang="scss" scoped>
.zone-selector {
  width: 100%;
}

.zone-buttons {
  button {
    background: transparent !important;
    &:hover {
      color: #fff !important;
    }
    .zone-button-content {
      font-size: 0.875rem;
    }
  }
}

/* Define styles for each zone */
:deep(button[aria-pressed='true']) {
  &[option-zone='Subject'] .p-togglebutton-content {
    background: linear-gradient(135deg, #c4b3ff 0%, #a38bfe 50%, #65f0d5 100%);
  }

  &[option-zone='Attributes'] .p-togglebutton-content {
    background: linear-gradient(135deg, #ffb5ec 0%, #ff8ae2 50%, #ffc46b 100%);
  }

  &[option-zone='Activity'] .p-togglebutton-content {
    background: linear-gradient(135deg, #80f0e8 0%, #50e8dc 50%, #3a55d0 100%);
  }

  &[option-zone='Aesthetics'] .p-togglebutton-content {
    background: linear-gradient(135deg, #a0e8b8 0%, #80d8a8 50%, #3548d9 100%);
  }

  &[option-zone='Mood'] .p-togglebutton-content {
    background: linear-gradient(135deg, #ffd750 0%, #e0b800 50%, #e5383b 100%);
  }

  &[option-zone='Setting'] .p-togglebutton-content {
    background: linear-gradient(135deg, #788bff 0%, #4d63d0 50%, #5e3a85 100%);
  }

  &[option-zone='Layout'] .p-togglebutton-content {
    background: linear-gradient(135deg, #ffd870 0%, #e5b845 50%, #fa8055 100%);
  }
}

:deep(button[aria-pressed='true']) {
  .zone-button-content {
    color: #fff;
  }
}

/* Add keyframes for the pulse animation */
@keyframes pulse {
  0% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.05);
  }
  100% {
    opacity: 0.3;
    transform: scale(1);
  }
}
</style>

<style>
.zone-buttons {
  button {
    background: rgb(33, 22, 58) !important;
    border: 1px solid rgb(33, 22, 58) !important;
    color: #bedfff !important;
  }
}
</style>
