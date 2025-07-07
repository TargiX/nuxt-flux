<template>
  <div class="skeleton-loader" :class="[`skeleton-${type}`, { 'skeleton-animated': animated }]">
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-image"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text" style="width: 80%"></div>
      </div>
    </div>

    <div v-else-if="type === 'list-item'" class="skeleton-list-item">
      <div class="skeleton-avatar"></div>
      <div class="skeleton-list-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle"></div>
      </div>
    </div>

    <div v-else-if="type === 'image'" class="skeleton-image-only"></div>

    <div v-else-if="type === 'text'" class="skeleton-text-only">
      <div
        v-for="i in lines"
        :key="i"
        class="skeleton-line"
        :style="{ width: getLineWidth(i) }"
      ></div>
    </div>

    <div v-else class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  type?: 'card' | 'list-item' | 'image' | 'text' | 'custom'
  animated?: boolean
  lines?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'card',
  animated: true,
  lines: 3,
})

const getLineWidth = (index: number) => {
  const widths = ['100%', '90%', '75%', '85%', '95%']
  return widths[(index - 1) % widths.length]
}
</script>

<style scoped>
.skeleton-loader {
  --skeleton-bg: rgba(255, 255, 255, 0.1);
  --skeleton-shine: rgba(255, 255, 255, 0.2);
}

.skeleton-animated .skeleton-image,
.skeleton-animated .skeleton-title,
.skeleton-animated .skeleton-text,
.skeleton-animated .skeleton-avatar,
.skeleton-animated .skeleton-subtitle,
.skeleton-animated .skeleton-line,
.skeleton-animated .skeleton-image-only {
  background: linear-gradient(
    90deg,
    var(--skeleton-bg) 25%,
    var(--skeleton-shine) 50%,
    var(--skeleton-bg) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Card skeleton */
.skeleton-card {
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
}

.skeleton-card .skeleton-image {
  width: 100%;
  height: 200px;
  background-color: var(--skeleton-bg);
}

.skeleton-card .skeleton-content {
  padding: 1rem;
}

.skeleton-card .skeleton-title {
  height: 24px;
  width: 60%;
  background-color: var(--skeleton-bg);
  border-radius: 4px;
  margin-bottom: 0.75rem;
}

.skeleton-card .skeleton-text {
  height: 16px;
  background-color: var(--skeleton-bg);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

/* List item skeleton */
.skeleton-list-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.skeleton-list-item .skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--skeleton-bg);
  flex-shrink: 0;
}

.skeleton-list-item .skeleton-list-content {
  flex: 1;
}

.skeleton-list-item .skeleton-title {
  height: 20px;
  width: 40%;
  background-color: var(--skeleton-bg);
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.skeleton-list-item .skeleton-subtitle {
  height: 16px;
  width: 60%;
  background-color: var(--skeleton-bg);
  border-radius: 4px;
}

/* Image only skeleton */
.skeleton-image-only {
  width: 100%;
  height: 100%;
  background-color: var(--skeleton-bg);
  border-radius: 8px;
  min-height: 200px;
}

/* Text only skeleton */
.skeleton-text-only {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.skeleton-line {
  height: 16px;
  background-color: var(--skeleton-bg);
  border-radius: 4px;
}

/* Custom skeleton */
.skeleton-custom {
  /* Styles for custom content via slot */
}
</style>
