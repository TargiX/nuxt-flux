<template>
    <div 
      :class="['tag', { 'selected': tag.selected }]" 
      :style="{ 
        fontSize: `${tag.size}px`,
        left: `${tag.x}px`,
        top: `${tag.y}px`
      }"
      @click="$emit('click')"
    >
      {{ tag.text }}
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    tag: {
      id: string
      text: string
      size: number
      selected: boolean
      x: number
      y: number
    }
  }>()
  
  defineEmits<{
    (e: 'click'): void
  }>()
  </script>
  
  <style lang="scss" scoped>
  .tag {
    position: absolute;
    margin: 5px;
    padding: 5px 10px;
    border-radius: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    user-select: none;
  
    &:hover {
      transform: scale(1.1);
    }
  
    &.selected {
      background-color: #4CAF50;
      color: white;
    }
  }
  </style>
  