<template>
  <div class="app-container">
    <Toast />
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Logo at the top -->
      <div class="logo-container">
        <img src="/assets/dreamseed-logo-white.png" alt="DreamSeed" class="logo" />
      </div>

      <!-- Navigation items -->
      <nav class="nav-menu">
        <!-- <a href="#" class="nav-item active">
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-plus"></i>
          <span>Create</span>
        </a>
      @
        <a href="#" class="nav-item">
          <i class="pi pi-compass"></i>
          <span>Explore</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-search"></i>
          <span>Search</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-bell"></i>
          <span>Notifications</span>
        </a> -->
        <NuxtLink to="/gallery" class="nav-item" :class="{ active: route.path === '/gallery' }">
          <i class="pi pi-th-large"></i>
          <span>Gallery</span>
        </NuxtLink>

        <!-- Help/Tutorial -->
        <a href="#" class="nav-item" @click.prevent="showTutorial">
          <i class="pi pi-question-circle"></i>
          <span>Help</span>
        </a>

        <!-- My Dreams Section -->
        <a
          href="#"
          class="nav-item"
          :class="{ active: route.path.startsWith('/dream/') || route.path === '/' }"
          @click.prevent="isDreamsOpen = !isDreamsOpen"
        >
          <i :class="['pi', isDreamsOpen ? 'pi-folder-open' : 'pi-folder']"></i>
          <span>My Dreams</span>
          <i
            :class="[
              'pi',
              'ml-auto',
              'text-xs',
              isDreamsOpen ? 'pi-chevron-down' : 'pi-chevron-right',
            ]"
          ></i>
        </a>
        <div v-if="isDreamsOpen" class="dreams-list-container">
          <ul class="dreams-list">
            <li
              v-if="tagStore.loadedDreamId !== null"
              class="dream-item new-dream-item"
              @click.stop="onSelectDream(null)"
            >
              <i class="pi pi-plus-circle mr-2 text-xs"></i>
              <span>New Dream</span>
            </li>
            <li
              v-if="tagStore.loadedDreamId === null"
              class="dream-item unsaved"
              :class="{ 'active-dream': route.path === '/dream/new' }"
              @click="onSelectDream(null)"
            >
              <i class="pi pi-pencil mr-2 text-xs"></i>
              <span>
                Current Session
                <span
                  v-if="tagStore.hasUnsavedChanges && tagStore.loadedDreamId === null"
                  class="unsaved-indicator"
                  >*</span
                >
              </span>
            </li>
            <li v-if="pending" class="dream-item loading">
              <i class="pi pi-spin pi-spinner mr-2"></i> Loading...
            </li>
            <li v-else-if="error" class="dream-item error">
              <i class="pi pi-exclamation-triangle mr-2 text-red-400"></i> Error loading dreams
            </li>
            <li
              v-else-if="!pending && !error && (!savedDreams || savedDreams.length === 0)"
              class="dream-item empty"
            >
              <i class="pi pi-info-circle mr-2"></i> No saved dreams yet.
            </li>
            <template v-else>
              <li
                v-for="dream in savedDreams"
                :key="dream.id"
                class="dream-item saved"
                :class="{ 'active-dream': route.path === `/dream/${dream.id}` }"
                @click="onSelectDream(dream)"
              >
                <!-- Inline editing for dream title -->
                <template v-if="editingDreamId === dream.id">
                  <InputText
                    ref="titleInputRef"
                    v-model="editingTitle"
                    class="inline-edit-title-input"
                    autofocus
                    @keyup.enter="saveDreamTitle(dream)"
                    @keyup.esc="cancelEditDreamTitle"
                    @blur="saveDreamTitle(dream)"
                  />
                </template>
                <template v-else>
                  <span class="dream-title">{{ dream.title || 'Untitled Dream' }}</span>
                  <span
                    v-if="
                      tagStore.hasUnsavedChanges &&
                      tagStore.loadedDreamId === dream.id &&
                      route.path === `/dream/${dream.id}`
                    "
                    class="unsaved-indicator"
                    >*</span
                  >
                </template>
                <ActionMenu
                  :items="menuItems"
                  button-class="dream-actions-button"
                  @open="
                    () => {
                      selectedDreamForMenu = dream
                    }
                  "
                />
              </li>
            </template>
          </ul>
        </div>
        <!-- End My Dreams Section -->
      </nav>

      <!-- User section at bottom -->
      <div class="user-section">
        <div v-if="status === 'authenticated' && session?.user" class="user-profile">
          <div class="user-avatar">
            <img
              v-if="session.user.image"
              :src="session.user.image"
              alt="User Avatar"
              class="avatar-image"
            />
            <i v-else class="pi pi-user"></i>
          </div>
          <span class="user-name">{{ session.user.name || 'User' }}</span>
          <Button
            icon="pi pi-sign-out"
            text
            rounded
            aria-label="Sign Out"
            class="p-button-secondary p-button-sm sign-out-button"
            @click="signOut()"
          />
        </div>
        <div v-else class="login-options">
          <!-- Email/Password Login Button -->
          <Button
            label="Sign in with Email"
            icon="pi pi-envelope"
            class="w-full mb-2"
            @click="router.push('/login')"
          />

          <!-- Google Login Button -->
          <Button
            label="Sign in with Google"
            icon="pi pi-google"
            class="w-full p-button-secondary"
            @click="signIn('google')"
          />
        </div>
      </div>
    </div>

    <!-- Main content -->
    <div class="main-content-container">
      <NuxtPage />
    </div>

    <!-- Add ConfirmDialog component -->
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue' // removed onMounted as they are in composable
import { useTagStore } from '~/store/tagStore'
// PrimeVue components used in the template still need to be imported here.
import Toast from 'primevue/toast'
import ActionMenu from '~/components/ActionMenu.vue'
import InputText from 'primevue/inputtext'
import { useDreamManagement } from '~/composables/useDreamManagement'
import { useRouter, useRoute } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import type { DreamSummary } from '~/types/dream'

// useAuth is auto-imported by Nuxt Auth; no manual import needed
const { status, session, signIn, signOut } = useAuth() // auth logic
const tagStore = useTagStore()

const router = useRouter()
const route = useRoute() // Get the current route object
const confirm = useConfirm()

// Initialize dream management logic from composable
const {
  isDreamsOpen,
  savedDreams,
  pending,
  error,
  menuItems,
  selectedDreamForMenu,
  editingDreamId,
  editingTitle,
  saveDreamTitle,
  cancelEditDreamTitle,
} = useDreamManagement()

// Navigate to dream session page, prompting save if needed via loadDream API
async function onSelectDream(dream: DreamSummary | null) {
  if (tagStore.hasUnsavedChanges) {
    const proceed = await new Promise((resolve) => {
      confirm.require({
        message: 'You have unsaved changes. Leave without saving?',
        header: 'Unsaved Changes',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Leave',
        rejectLabel: 'Cancel',
        rejectClass: 'p-button-secondary',
        accept: () => resolve(true),
        reject: () => resolve(false),
      })
    })
    if (!proceed) return
  }
  // Navigate to selected dream or new session
  const targetPath = dream ? `/dream/${dream.id}` : '/dream/new'
  console.log(`[onSelectDream] Navigating to: ${targetPath}`)
  router.push(targetPath)
}

// Ref for the Menu component instance - this needs to stay in the component that renders the Menu
const titleInputRef = ref<any>(null) // Ref for the InputText component

// Watch for editingDreamId to change, then focus the input
watch(editingDreamId, (newId) => {
  if (newId !== null) {
    nextTick(() => {
      // PrimeVue InputText might have the focus method on the component itself
      // or on its underlying input element ($el). Check PrimeVue docs if direct .focus() fails.
      if (titleInputRef.value) {
        if (typeof titleInputRef.value.focus === 'function') {
          titleInputRef.value.focus()
        } else if (titleInputRef.value.$el && typeof titleInputRef.value.$el.focus === 'function') {
          titleInputRef.value.$el.focus()
        }
      }
    })
  }
})

// Show tutorial function
const showTutorial = () => {
  // Emit an event that the main page can listen to
  // Since this is a layout, we'll use a global event bus or store
  // For now, let's use localStorage to trigger it
  localStorage.removeItem('hasSeenTutorial')
  // Force reload to show tutorial
  window.location.reload()
}

// Any other component-specific logic for default.vue that was not moved...
</script>

<style lang="scss">
.app-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.sidebar {
  width: 280px;
  background-color: rgb(16 13 44 / 70%);
  display: flex;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  flex-direction: column;
  padding: 20px 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.logo-container {
  padding: 0 20px 20px 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;

  .logo {
    height: 50px;
    width: auto;
    transition: transform 0.3s ease;
    &:hover {
      transform: scale(1.05);
    }
  }
}

.nav-menu {
  flex-grow: 1;
  overflow-y: auto;
  padding: 0 15px;

  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 15px;
    margin-bottom: 8px;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
    font-size: 0.9rem;
    font-weight: 500;

    i {
      margin-right: 12px;
      font-size: 1.1rem;
    }

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    &.active {
      background-color: rgba(
        79,
        70,
        229,
        0.7
      ); // Active item highlight (Tailwind indigo-600 equivalent with alpha)
      color: white;
      font-weight: 600;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3);

      i {
        // color: #c7d2fe; // Lighter icon color for active state if needed
      }
    }
  }
}

.dreams-list-container {
  padding: 0px 15px 10px 5px; // Reduced top padding
  margin-top: -5px; // Pull it slightly up to reduce space from "My Dreams" link

  .dreams-list {
    list-style: none;
    padding-left: 5px; // Indent dream items slightly
    margin-top: 8px;

    .dream-item {
      position: relative; // Added for absolute positioning of the button
      display: flex;
      align-items: center;
      padding: 8px 10px;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
      border-radius: 6px;
      margin-bottom: 4px;
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease;

      .dream-actions-button {
        position: absolute;
        right: -7px; // Adjust as needed for padding from the right edge
        top: 50%;
        transform: translateY(-50%);
        visibility: hidden; // Hidden by default
        opacity: 0;
        transition: opacity 0.2s ease, visibility 0.2s ease;
        color: white;
        background-color: rgba(
          0,
          0,
          0,
          0.1
        ); // Slight background for better visibility on hover state
      }

      &:hover .dream-actions-button {
        visibility: visible;
        opacity: 1;
      }

      .inline-edit-title-input {
        flex-grow: 1;
        font-size: 0.85rem; // Match span font size
        padding: 2px 4px; // Minimal padding
        margin-left: 4px; // Align with where icon was if needed
        border-radius: 4px;
        // Add other styling as needed to match your design
      }

      &:hover {
        background-color: rgba(255, 255, 255, 0.08);
        color: white;
      }

      &.active-dream {
        background-color: rgba(79, 70, 229, 0.5);
        color: white;
        font-weight: 500;
      }

      &.unsaved {
        // Style for current session / add new
      }

      &.saved {
        // Style for saved dreams
      }

      .dream-title {
        white-space: nowrap;
        overflow: hidden;
        flex-grow: 1;
        min-width: 0;
        max-width: 100%;
        mask-image: linear-gradient(to right, black 80%, transparent 100%);
      }

      .unsaved-indicator {
        color: #facc15; // Tailwind yellow-400
        margin-left: 4px;
        font-weight: bold;
      }
    }
    .loading,
    .error,
    .empty {
      font-style: italic;
      color: rgba(255, 255, 255, 0.5);
      padding: 8px 10px;
      display: flex;
      align-items: center;
    }
  }
}

.user-section {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto; // Pushes user section to the bottom

  .user-profile {
    display: flex;
    align-items: center;
    color: white;
    font-size: 0.9rem;

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      overflow: hidden;

      .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      i {
        font-size: 1.2rem;
      }
    }

    .user-name {
      flex-grow: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 8px;
    }

    .sign-out-button {
      :deep(.p-button-icon) {
        font-size: 0.9rem;
      }
      width: 2.25rem;
      height: 2.25rem;
    }
  }

  .login-options {
    .p-button {
      font-size: 0.9rem;
    }
    // Adjust spacing or styles for login buttons if needed
  }
}

.main-content-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  // background: radial-gradient(circle at top left, #0f172a, #1e293b 70%);
}

/* Global styles that were previously in app.vue or should be global */
/* Add any global styles here or ensure they are in a global CSS file imported in nuxt.config */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif,
    'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
  background-color: #0f172a; // Default body background
  color: #e2e8f0; // Default text color for better contrast on dark bg
}

/* PrimeVue Customizations - if you have them and they were in app.vue globally */
.p-component {
  font-family: inherit !important;
}

/* Example: Custom Scrollbar for Webkit browsers (like Chrome, Safari) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
