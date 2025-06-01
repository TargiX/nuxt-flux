<template>
  <div class="zone-selector" ref="container">
    <SelectButton 
      :modelValue="modelValue" 
      :options="options" 
      :optionLabel="props.optionLabel" 
      :optionValue="props.optionValue" 
      severity="primary"
      class="zone-buttons"
      @update:modelValue="$emit('update:modelValue', $event)"
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
import { ref, onMounted, watch, nextTick } from 'vue';

interface ZoneOption {
  name: string;
  count: number;
}

const props = defineProps<{
  modelValue: string; // Stays as string
  options: ZoneOption[]; // Now expects array of objects
  optionLabel?: string; // For PrimeVue SelectButton
  optionValue?: string; // For PrimeVue SelectButton
}>();

defineEmits(['update:modelValue']);

const container = ref<HTMLElement | null>(null);

// Add custom attributes to buttons after rendering
onMounted(() => {
  addZoneAttributes();
});

// Re-apply attributes when options change
watch(() => props.options, () => {
  // Use nextTick to ensure DOM is updated before trying to find buttons
  nextTick(addZoneAttributes);
}, { deep: true }); // Add deep watch if options objects might change internally without array replacement

function addZoneAttributes() {
  if (!container.value) return;
  
  const buttons = container.value.querySelectorAll('.zone-buttons button'); // Be more specific with selector
  buttons.forEach((button, index) => {
    if (index < props.options.length && props.options[index]) {
      button.setAttribute('option-zone', props.options[index].name);
    }
  });
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
      font-size: .875rem;
    }
  }
}

/* Define styles for each zone */
:deep(button[aria-pressed="true"]) {
  &[option-zone="Subject"] .p-togglebutton-content {
    background: rgb(62, 25, 164) !important;
  }
  
  &[option-zone="Attributes"] .p-togglebutton-content {
    background: rgb(62, 25, 164) !important;
  }
  
  &[option-zone="Activity"] .p-togglebutton-content {
    background: rgb(62, 25, 164) !important;
  }
  
  &[option-zone="Aesthetics"] .p-togglebutton-content {
    background: rgb(62, 25, 164) !important;
  }
  
  &[option-zone="Mood"] .p-togglebutton-content {
    background: rgb(62, 25, 164) !important;
  }
  
  &[option-zone="Setting"] .p-togglebutton-content {
    background: rgb(62, 25, 164) !important;
  }
  
  &[option-zone="Layout"] .p-togglebutton-content {
    background: rgb(62, 25, 164) !important;
  }
  

}

:deep(button[aria-pressed="true"]) {
    .zone-button-content {
      color: rgb(218 221 255) !important;
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
    border: 1px solid rgb(33, 22, 58)  !important;
    color: #bedfff !important;
  }
}
</style>