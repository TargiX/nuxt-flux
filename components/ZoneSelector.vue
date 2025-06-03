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
    background: linear-gradient(135deg, #C4B3FF 0%, #A38BFE 50%, #65F0D5 100%);
  }
  
  &[option-zone="Attributes"] .p-togglebutton-content {
    background: linear-gradient(135deg, #FFB5EC 0%, #FF8AE2 50%, #FFC46B 100%);
  }
  
  &[option-zone="Activity"] .p-togglebutton-content {
    background: linear-gradient(135deg, #80F0E8 0%, #50E8DC 50%, #3A55D0 100%);
  }
  
  &[option-zone="Aesthetics"] .p-togglebutton-content {
    background: linear-gradient(135deg, #A0E8B8 0%, #80D8A8 50%, #3548D9 100%);
  }
  
  &[option-zone="Mood"] .p-togglebutton-content {
    background: linear-gradient(135deg, #FFD750 0%, #E0B800 50%, #E5383B 100%);
  }
  
  &[option-zone="Setting"] .p-togglebutton-content {
    background: linear-gradient(135deg, #788BFF 0%, #4D63D0 50%, #5E3A85 100%);
  }
  
  &[option-zone="Layout"] .p-togglebutton-content {
    background: linear-gradient(135deg, #FFD870 0%, #E5B845 50%, #FA8055 100%);
  }
  

}

:deep(button[aria-pressed="true"]) {
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
    border: 1px solid rgb(33, 22, 58)  !important;
    color: #bedfff !important;
  }
}
</style>