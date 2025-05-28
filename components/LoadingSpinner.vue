<template>
  <ProgressSpinner
    :class="spinnerClass"
    :style="spinnerStyle"
    :strokeWidth="props.strokeWidth"
    fill="transparent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ProgressSpinner from 'primevue/progressspinner';

interface Props {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  width?: number;
  height?: number;
  strokeWidth?: string;
  class?: string;
  fill?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'sm',
  strokeWidth: '8',
  class: ''
});

const spinnerClass = computed(() => {
  // If width/height are provided, don't use size classes
  if (props.width || props.height) {
    return `white-spinner ${props.class}`;
  }
  
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };
  
  return `white-spinner ${sizeClasses[props.size]} ${props.class}`;
});

const spinnerStyle = computed(() => {
  if (props.width || props.height) {
    return {
      width: props.width ? `${props.width}px` : undefined,
      height: props.height ? `${props.height}px` : undefined
    };
  }
  return {};
});
</script>

<style>
.white-spinner :deep(.p-progress-spinner-circle) {
  stroke: white !important;
  animation: p-progress-spinner-dash 1.5s ease-in-out infinite;
}

.white-spinner :deep(.p-progress-spinner-svg) {
  animation: p-progress-spinner-rotate 2s linear infinite;
}

/* Ensure the spinner stays white and doesn't cycle colors */
.white-spinner :deep(.p-progress-spinner) {
  color: white !important;
}
</style> 