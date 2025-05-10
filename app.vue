<template>
  <div class="app-container">
    <Toast />
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Logo at the top -->
      <div class="logo-container">
        <img src="/assets/dreamseed-logo-white.png" alt="DreamSeed" class="logo">
      </div>
      
      <!-- Navigation items -->
      <nav class="nav-menu">
        <a href="#" class="nav-item active">
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-plus"></i>
          <span>Create</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-images"></i>
          <span>Library</span>
        </a>
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
        </a>

        <!-- My Dreams Section -->
        <a href="#" class="nav-item" @click.prevent="isDreamsOpen = !isDreamsOpen">
          <i :class="['pi', isDreamsOpen ? 'pi-folder-open' : 'pi-folder']"></i>
          <span>My Dreams</span>
           <i :class="['pi', 'ml-auto', 'text-xs', isDreamsOpen ? 'pi-chevron-down' : 'pi-chevron-right']"></i>
        </a>
        <div v-if="isDreamsOpen" class="dreams-list-container">
          <ul class="dreams-list">
            <li 
              class="dream-item unsaved" 
              :class="{ 'active-dream': tagStore.loadedDreamId === null }" 
              @click="loadDream(null)"
            >
              <i class="pi pi-pencil mr-2 text-xs"></i>
              <span>
                {{ tagStore.loadedDreamId === null ? 'Current Session' : 'Add new Dream' }}
                <span v-if="tagStore.hasUnsavedChanges && tagStore.loadedDreamId === null" class="unsaved-indicator">*</span>
              </span>
            </li>
            <li v-if="pending" class="dream-item loading">
              <i class="pi pi-spin pi-spinner mr-2"></i> Loading...
            </li>
            <li v-if="error" class="dream-item error">
              <i class="pi pi-exclamation-triangle mr-2 text-red-400"></i> Error loading dreams
            </li>
             <li v-if="!pending && !error && (!savedDreams || savedDreams.length === 0)" class="dream-item empty">
                <i class="pi pi-info-circle mr-2"></i> No saved dreams yet.
             </li>
            <li 
              v-for="dream in savedDreams" 
              :key="dream.id" 
              class="dream-item saved" 
              :class="{ 'active-dream': tagStore.loadedDreamId === dream.id }" 
              @click="loadDream(dream)"
            >
              <i class="pi pi-image mr-2 text-xs"></i> 
              <span class="dream-title">{{ dream.title || 'Untitled Dream' }}</span>
              <span v-if="tagStore.hasUnsavedChanges && tagStore.loadedDreamId === dream.id" class="unsaved-indicator">*</span>
            </li>
          </ul>
        </div>
        <!-- End My Dreams Section -->

      </nav>
      
      <!-- User section at bottom -->
      <div class="user-section">
        <div v-if="status === 'authenticated' && session?.user" class="user-profile">
          <div class="user-avatar">
             <img v-if="session.user.image" :src="session.user.image" alt="User Avatar" class="avatar-image" />
             <i v-else class="pi pi-user"></i>
          </div>
          <span class="user-name">{{ session.user.name || 'User' }}</span>
          <Button 
            icon="pi pi-sign-out" 
            @click="signOut()" 
            text 
            rounded 
            aria-label="Sign Out"
            class="p-button-secondary p-button-sm sign-out-button" 
           />
        </div>
        <div v-else class="login-options">
          <!-- Email/Password Login Button -->
          <Button 
            label="Sign in with Email" 
            icon="pi pi-envelope" 
            @click="navigateTo('/login')" 
            class="w-full mb-2" 
          />
          
          <!-- Google Login Button -->
          <Button 
            label="Sign in with Google" 
            icon="pi pi-google" 
            @click="signIn('google')" 
            class="w-full p-button-secondary" 
          />
        </div>
      </div>
    </div>
    
    <!-- Main content -->
    <div class="main-content">
      <NuxtPage />
    </div>

    <!-- Add ConfirmDialog component -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { Dream } from '~/types/dream';
import { useTagStore } from '~/store/tagStore'; // Import the store

const { status, session, signIn, signOut } = useAuth();
const tagStore = useTagStore(); // Initialize the store
const confirm = useConfirm(); // Initialize confirmation service

// State for dreams list - Initialize from localStorage
const isDreamsOpen = ref(false); 

// Fetch saved dreams
const { data: savedDreams, pending, error, refresh } = useFetch<Dream[]>('/api/dreams', { 
  lazy: true, 
  default: () => [],
  watch: [status]
});

// --- Inject refresh function into the store ---
onMounted(() => {
  // Ensure refresh is available before setting it
  if (refresh) {
    tagStore.setDreamsListRefresher(refresh);
  }
  const storedState = localStorage.getItem('dreamsListOpen');
  isDreamsOpen.value = storedState === 'true';
});
// ---------------------------------------------

// Watch for changes and save to localStorage
watch(isDreamsOpen, (newValue) => {
  localStorage.setItem('dreamsListOpen', String(newValue));
});

// --- Updated Function to Load Dream State with Confirmation ---
function loadDream(dream: Dream | null) {
  const targetDreamId = dream ? dream.id : null;

  // Check if we are trying to load a *different* dream and if there are unsaved changes
  if (tagStore.hasUnsavedChanges && tagStore.loadedDreamId !== targetDreamId) {
    confirm.require({
      message: 'You have unsaved changes. Do you want to save them before loading the new dream?',
      header: 'Unsaved Changes',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Save & Load',
      rejectLabel: 'Load Without Saving',
      accept: async () => {
        // User wants to save first
        console.log('Save & Load selected');
        // Find the save button in TagCloud and click it programmatically? - This is tricky.
        // **Alternative/Better:** Need a dedicated save action in the store.
        // await tagStore.saveCurrentDream(); // Assuming this action exists
        console.warn('Programmatic saving before load not implemented yet. Loading without saving.');
        proceedWithLoad(dream);
      },
      reject: () => {
        // User wants to discard changes
        console.log('Load Without Saving selected');
        proceedWithLoad(dream);
      }
      // Implicit cancel: If the user closes the dialog, nothing happens.
    });
  } else {
    // No unsaved changes, or loading the same dream again: proceed directly
    proceedWithLoad(dream);
  }
}

// Helper function to actually load the state
function proceedWithLoad(dream: Dream | null) {
   const targetDreamId = dream ? dream.id : null;
   
   if (targetDreamId !== tagStore.loadedDreamId) { // Only load if it's different
        if (dream && dream.data) {
            console.log(`Loading Dream ID: ${dream.id}`);
            tagStore.loadDreamState(dream.data, dream.id); 
            isDreamsOpen.value = false;
        } else if (dream === null) {
            console.log("Resetting to Current Session");
            tagStore.resetToCurrentSession(); // Use the reset action
            isDreamsOpen.value = false; 
        } else {
            console.error("Attempted to load invalid dream data", dream);
        }
    } else {
        console.log("Clicked already active dream. Closing list.");
        isDreamsOpen.value = false; // Close list if clicking the active one
    }
}
// ---------------------------------

// Optional: Log fetched data for debugging
watch(savedDreams, (newDreams) => {
  console.log('Fetched Dreams:', newDreams);
});
watch(error, (newError) => {
  if (newError) console.error('Error fetching dreams:', newError);
});

</script>

<style lang="scss">
.app-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.logo-container {
  padding: 10px 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 15px;
  
  .logo {
    height: 55px;
    width: auto;
  }
}

.nav-menu {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.2s ease;
    
    i {
      margin-right: 12px;
      font-size: 1.2rem;
    }
    
    &:hover, &.active {
      color: #fff;
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    &.active {
      border-left: 3px solid #8EC5FC;
      padding-left: 17px;
    }
  }
}

.user-section {
  margin-top: auto;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .user-profile {
    display: flex;
    align-items: center;
    position: relative;
    
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8EC5FC, #E0C3FC);
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
        color: #fff;
        font-size: 0.9rem;
      }
    }
    
    .user-name {
      color: #fff;
      font-size: 0.9rem;
    }

    .sign-out-button {
      margin-left: auto;
    }
  }

  .login-options {
    // Add appropriate styles for login options
  }
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-x: hidden;
  min-width: 0;
}

.dreams-list-container {
  background-color: rgba(255, 255, 255, 0.05); // Slightly different background
  padding: 5px 0;
}

.dreams-list {
  list-style: none;
  padding: 0;
  margin: 0;

  .dream-item {
    display: flex;
    align-items: center;
    padding: 8px 20px 8px 40px; // Indent dream items
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    cursor: default; // Default cursor, change when clickable
    transition: background-color 0.2s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.9);
    }

    &.unsaved span {
      font-style: italic;
    }
    
    &.loading span,
    &.error span,
    &.empty span {
        font-style: italic;
        color: rgba(255, 255, 255, 0.5);
    }

    .dream-title {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.dream-item.saved {
    cursor: pointer; /* Make saved items look clickable */
}

.dream-item {
  &.active-dream {
    background-color: rgba(255, 255, 255, 0.15); // Highlight background
    color: #fff; // Brighter text
    font-weight: 500;
  }
  .unsaved-indicator {
      color: #facc15; // Yellow color for asterisk
      margin-left: 4px;
      font-weight: bold;
  }
}
</style>
