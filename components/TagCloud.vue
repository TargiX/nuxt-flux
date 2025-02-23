<template>
  <div>
    <h2>{{ focusedZone }}</h2>
    <ForceGraph
      :width="600"
      :height="400"
      :nodes="graphNodes"
      :links="graphLinks"
      @nodeClick="handleNodeClick"
      @nodePositionsUpdated="handleNodePositionsUpdated"
    />
    <button v-for="zone in zones" :key="zone" @click="switchToZone(zone)">{{ zone }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useTagStore } from '~/store/tagStore';
import ForceGraph from './ForceGraph.vue';

const tagStore = useTagStore();
const focusedZone = computed(() => tagStore.focusedZone);
const zones = computed(() => tagStore.zones);
const graphNodes = computed(() => tagStore.graphNodes);
const graphLinks = computed(() => tagStore.graphLinks);

function handleNodeClick(id: string) {
  console.log('TagCloud received nodeClick:', id);
  tagStore.toggleTag(id);
}

function switchToZone(zone: string) {
  console.log(`Switching to ${zone}`);
  tagStore.setFocusedZone(zone);
}

function handleNodePositionsUpdated(positions: { id: string; x: number; y: number }[]) {
  console.log('Received updated positions:', positions);
  positions.forEach(pos => {
    const tag = tagStore.tags.find(t => t.id === pos.id);
    if (tag) {
      tag.x = pos.x;
      tag.y = pos.y;
    }
  });
}
</script>