<template>
  <div class="app-container">
    <!-- Main content -->
    <div class="main-content flex-1">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>

    <!-- Add ConfirmDialog component -->
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup lang="ts">
import { useTagStore } from '~/store/tagStore' // Import the store

const tagStore = useTagStore() // Initialize the store
</script>

<style lang="scss"></style>
