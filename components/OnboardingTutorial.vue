<template>
  <div v-if="showTutorial" class="tutorial-overlay" @click="handleOverlayClick">
    <div class="tutorial-container glass-card" @click.stop>
      <div class="tutorial-header">
        <h2>Welcome to DreamSeed! 🎨</h2>
        <Button
          icon="pi pi-times"
          class="p-button-text p-button-rounded tutorial-close"
          @click="closeTutorial"
        />
      </div>

      <div class="tutorial-content">
        <div v-if="currentStep === 0" class="tutorial-step">
          <div class="step-icon">
            <i class="pi pi-sparkles"/>
          </div>
          <h3>Create Amazing AI Art</h3>
          <p class="frosted-card-text">
            DreamSeed helps you generate beautiful images using AI. Select tags from our visual
            graph to build your perfect prompt.
          </p>
          <!-- <div class="step-image">
            <img src="/tutorial/overview.png" alt="App overview" />
          </div> -->
        </div>

        <div v-else-if="currentStep === 1" class="tutorial-step">
          <div class="step-icon">
            <i class="pi pi-sitemap"/>
          </div>
          <h3>1. Select Tags</h3>
          <p>
            Click on tags in the force graph to add them to your prompt. Tags are organized by zones
            like Subject, Style, and Mood.
          </p>
          <ul class="tutorial-tips">
            <li>🎯 Click parent tags (like "Humans") to see more options</li>
            <li>🎨 Combine tags from different zones for unique results</li>
            <li>✨ Selected tags turn vibrant colors</li>
          </ul>
        </div>

        <div v-else-if="currentStep === 2" class="tutorial-step">
          <div class="step-icon">
            <i class="pi pi-image"/>
          </div>
          <h3>2. Generate Images</h3>
          <p>
            Once you've selected your tags, click "Generate Image" to create your artwork. Each
            generation takes about 10-20 seconds.
          </p>
          <ul class="tutorial-tips">
            <li>💡 The AI will create a detailed prompt from your tags</li>
            <li>🔄 You can regenerate with the same tags for variations</li>
            <li>📝 Switch to Manual mode to edit the prompt directly</li>
          </ul>
        </div>

        <div v-else-if="currentStep === 3" class="tutorial-step">
          <div class="step-icon">
            <i class="pi pi-save"/>
          </div>
          <h3>3. Save Your Dreams</h3>
          <p>
            Save your creative sessions as "Dreams" to build a history of your generated images and
            tag combinations.
          </p>
          <ul class="tutorial-tips frosted-card-text">
            <li>💾 Click the save button to preserve your session</li>
            <li>📚 Access saved dreams from the sidebar</li>
            <li>🔍 Return to any dream to continue where you left off</li>
          </ul>
        </div>

        <div v-else-if="currentStep === 4" class="tutorial-step">
          <div class="step-icon">
            <i class="pi pi-check-circle"/>
          </div>
          <h3>Ready to Create!</h3>
          <p>You're all set! Start by selecting some tags and generating your first image.</p>
          <div class="tutorial-actions">
            <Button
              label="Start Creating"
              icon="pi pi-arrow-right"
              class="p-button-primary"
              @click="closeTutorial"
            />
          </div>
        </div>
      </div>

      <div class="tutorial-footer">
        <div class="tutorial-dots">
          <span
            v-for="i in totalSteps"
            :key="i"
            class="dot"
            :class="{ active: currentStep === i - 1 }"
            @click="currentStep = i - 1"
          />
        </div>
        <div class="tutorial-nav">
          <Button
            v-if="currentStep > 0"
            label="Previous"
            icon="pi pi-chevron-left"
            class="p-button-text"
            @click="previousStep"
          />
          <Button
            v-if="currentStep < totalSteps - 1"
            label="Next"
            icon="pi pi-chevron-right"
            icon-pos="right"
            class="p-button-primary"
            @click="nextStep"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Button from 'primevue/button'

const showTutorial = ref(false)
const currentStep = ref(0)
const totalSteps = 5

const emit = defineEmits(['complete'])

onMounted(() => {
  // Check if user has seen tutorial
  const hasSeenTutorial = localStorage.getItem('hasSeenTutorial')
  if (!hasSeenTutorial) {
    showTutorial.value = true
  }
})

const nextStep = () => {
  if (currentStep.value < totalSteps - 1) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const closeTutorial = () => {
  showTutorial.value = false
  localStorage.setItem('hasSeenTutorial', 'true')
  emit('complete')
}

const handleOverlayClick = (e: MouseEvent) => {
  // Close on overlay click
  closeTutorial()
}

// Expose method to manually show tutorial
const show = () => {
  showTutorial.value = true
  currentStep.value = 0
}

defineExpose({ show })
</script>

<style lang="scss" scoped>
.tutorial-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  padding: 1rem;
}

.tutorial-container {
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.tutorial-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.tutorial-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.tutorial-close {
  width: 2rem;
  height: 2rem;
}

.tutorial-content {
  padding: 2rem;
  min-height: 300px;
}

.tutorial-step {
  text-align: center;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.step-icon {
  width: 80px;
  height: 80px;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
}

.step-icon i {
  font-size: 2.5rem;
  color: white;
}

.tutorial-step h3 {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.tutorial-step p {
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.step-image {
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
}

.step-image img {
  width: 100%;
  height: auto;
  display: block;
}

.tutorial-tips {
  text-align: left;
  list-style: none;
  padding: 0;
  margin: 0;
}

.tutorial-tips li {
  padding: 0.5rem 0;
  line-height: 1.5;
  color: v
}

.tutorial-actions {
  margin-top: 2rem;
}

.tutorial-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tutorial-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--surface-border);
  cursor: pointer;
  transition: all 0.3s ease;
}

.dot.active {
  background: var(--primary-color);
  transform: scale(1.3);
}

.tutorial-nav {
  display: flex;
  gap: 1rem;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .tutorial-container {
    max-height: 100vh;
    border-radius: 0;
  }

  .tutorial-content {
    padding: 1.5rem;
  }

  .step-icon {
    width: 60px;
    height: 60px;
  }

  .step-icon i {
    font-size: 2rem;
  }
}
</style>
