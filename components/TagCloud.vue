<template>
    <div class="tag-cloud">
      <div v-for="zone in zones" :key="zone" class="zone">
        <h2>{{ zone }}</h2>
        <svg :width="zoneWidth" :height="zoneHeight" class="zone-svg">
          <g :transform="`translate(${zoneWidth/2}, ${zoneHeight/2})`">
            <!-- Central point -->
            <circle r="5" fill="#333" />
            <!-- Connecting lines -->
            <line v-for="tag in tagsByZone(zone)" :key="tag.id"
              :x2="tag.x" :y2="tag.y" stroke="#ccc" stroke-width="1" />
            <!-- Tags -->
            <g v-for="tag in tagsByZone(zone)" :key="tag.id"
              :transform="`translate(${tag.x}, ${tag.y})`">
              <circle :r="tag.size/2 + 10" fill="#f0f0f0" :class="{ 'selected': tag.selected }" />
              <text text-anchor="middle" alignment-baseline="middle" @click="toggleTag(tag.id)">
                {{ tag.text }}
              </text>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useTagStore } from '~/store/tagStore'
  
  const tagStore = useTagStore()
  const { zones, tagsByZone } = storeToRefs(tagStore)
  const { toggleTag, fetchTags } = tagStore
  
  const zoneWidth = 300
  const zoneHeight = 300
  
  onMounted(async () => {
    await fetchTags()
    layoutTags()
  })
  
  watch(() => tagStore.tags, layoutTags, { deep: true })
  
  function layoutTags() {
    zones.value.forEach(zone => {
      const tags = tagsByZone.value(zone)
      const radius = Math.min(zoneWidth, zoneHeight) / 2 - 30 // Leaving some margin
      const angleStep = (2 * Math.PI) / tags.length
  
      tags.forEach((tag, index) => {
        const angle = index * angleStep
        tag.x = radius * Math.cos(angle)
        tag.y = radius * Math.sin(angle)
      })
    })
  }
  </script>
  
  <style lang="scss" scoped>
  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
  }
  
  .zone {
    margin: 10px;
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }
  
  .zone-svg {
    circle.selected {
      fill: #4CAF50;
    }
  
    text {
      font-size: 12px;
      cursor: pointer;
      user-select: none;
    }
  }
  </style>