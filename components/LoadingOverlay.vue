<template>
  <div v-if="visible" class="loading-overlay">
    <div class="loading-content">
      <ProgressSpinner 
        :style="{ width: spinnerSize, height: spinnerSize }" 
        strokeWidth="4" 
        fill="var(--surface-ground)" 
        animationDuration=".8s" 
      />
      <p v-if="message" class="loading-message">{{ message }}</p>
      <p v-if="showProgress && progress" class="loading-progress">{{ progress }}%</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'

interface Props {
  visible: boolean
  message?: string
  size?: 'small' | 'medium' | 'large'
  showProgress?: boolean
  progress?: number
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  size: 'medium',
  showProgress: false,
  progress: 0
})

const spinnerSize = computed(() => {
  const sizes = {
    small: '30px',
    medium: '50px',
    large: '70px'
  }
  return sizes[props.size]
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.loading-message {
  color: white;
  font-size: 1.1rem;
  margin: 0;
  text-align: center;
  max-width: 300px;
}

.loading-progress {
  color: #64b5f6;
  font-size: 0.9rem;
  margin: 0;
  font-weight: 600;
}
</style> 