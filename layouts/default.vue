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
              class="dream-item new-dream-item"
              v-if="tagStore.hasUnsavedChanges || tagStore.loadedDreamId !== null"
              @click.stop="handleAddNewDream"
            >
              <i class="pi pi-plus-circle mr-2 text-xs"></i>
              <span>New Dream</span>
            </li>
            <li 
              class="dream-item unsaved" 
              v-if="tagStore.loadedDreamId === null"
              :class="{ 'active-dream': tagStore.loadedDreamId === null }" 
              @click="loadDream(null)"
            >
              <i class="pi pi-pencil mr-2 text-xs"></i>
              <span>
                  Unsaved Session
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
              <template v-if="editingDreamId === dream.id">
                <InputText 
                  v-model="editingTitle" 
                  class="inline-edit-title-input"
                  @keyup.enter="saveDreamTitle(dream)" 
                  @keyup.esc="cancelEditDreamTitle" 
                  @blur="saveDreamTitle(dream)" 
                  autofocus 
                />
              </template>
              <template v-else>
                <span class="dream-title">{{ dream.title || 'Untitled Dream' }}</span>
                <span v-if="tagStore.hasUnsavedChanges && tagStore.loadedDreamId === dream.id" class="unsaved-indicator">*</span>
              </template>
              <Button 
                icon="pi pi-ellipsis-v" 
                class="p-button-text p-button-sm p-button-rounded dream-actions-button"
                @click.stop="toggleDreamActionMenu($event, dream)"
                aria-haspopup="true"
                aria-controls="dream_action_menu"
              />
            </li>
          </ul>
          <Menu ref="dreamActionMenu" id="dream_action_menu" :model="menuItems" :popup="true" />
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
    <div class="main-content-container">
      <NuxtPage />
    </div>

    <!-- Add ConfirmDialog component -->
 
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { Dream } from '~/types/dream';
import { useTagStore } from '~/store/tagStore'; // Import the store
// import Toast from 'primevue/toast'; // Removed duplicate import
import { useConfirm } from "primevue/useconfirm";
import ConfirmDialog from 'primevue/confirmdialog';
import Menu from 'primevue/menu'; // Import Menu
import InputText from 'primevue/inputtext'; // Import InputText
import { useToast } from 'primevue/usetoast'; // Import useToast

const { status, session, signIn, signOut } = useAuth();
const tagStore = useTagStore(); // Initialize the store
const confirm = useConfirm(); // Initialize confirmation service
const toast = useToast(); // Initialize toast service

// --- Refs for Dream Actions Menu ---
const dreamActionMenu = ref();
const selectedDreamForMenu = ref<Dream | null>(null);
const menuItems = ref([
  {
    label: 'Rename',
    icon: 'pi pi-pencil',
    command: () => {
      if (selectedDreamForMenu.value) {
        startEditingDreamTitle(selectedDreamForMenu.value);
      }
    }
  },
  // Add other actions like 'Delete' here later
]);

function toggleDreamActionMenu(event: MouseEvent, dream: Dream) {
  selectedDreamForMenu.value = dream;
  dreamActionMenu.value.toggle(event);
}

// Placeholder for editing logic (Step 2.3)
const editingDreamId = ref<number | null>(null);
const editingTitle = ref('');

function startEditingDreamTitle(dream: Dream) {
  editingDreamId.value = dream.id;
  editingTitle.value = dream.title || '';
  // We will replace the span with an input in the template
}

async function saveDreamTitle(dream: Dream) {
  if (editingDreamId.value === null || !dream) return;
  const originalTitle = dream.title;
  const newTitle = editingTitle.value.trim();

  if (!newTitle) {
    toast.add({ severity: 'warn', summary: 'Validation', detail: 'Title cannot be empty.', life: 3000 });
    // Optionally, revert to originalTitle in the input or just cancel edit
    editingTitle.value = originalTitle || ''; // Revert input to original if empty
    // Do not close edit mode, let user correct or cancel
    return; 
  }

  if (newTitle === originalTitle) {
    editingDreamId.value = null; // No change, just close edit mode
    editingTitle.value = '';
    return;
  }

  try {
    const { data: updatedDream, error } = await useFetch(`/api/dreams/${dream.id}`, {
      method: 'PUT',
      body: { title: newTitle },
      watch: false // We will manually refresh or update
    });

    if (error.value) {
      console.error('Error updating dream title:', error.value);
      toast.add({ severity: 'error', summary: 'Error', detail: error.value.data?.message || 'Could not update title.', life: 3000 });
      // Optionally, revert title in UI or keep input open for retry
      // For now, we keep the input open with the attempted new title.
    } else if (updatedDream.value) {
      toast.add({ severity: 'success', summary: 'Success', detail: 'Dream title updated!', life: 3000 });
      // Update the local list directly for immediate feedback
      const dreamInList = savedDreams.value?.find(d => d.id === dream.id);
      if (dreamInList) {
        dreamInList.title = (updatedDream.value as Dream).title;
      }
      // It might still be good to call the store's refresh to ensure full consistency
      // if other parts of the app depend on the raw `savedDreams` fetch.
      // However, direct update is faster for UI.
      // Consider if tagStore.refreshDreamsList() is needed or if direct update is sufficient.
      // For now, let's assume direct update + the existing refresh mechanism for savedDreams is enough.
      // If not, uncomment: tagStore.refreshDreamsList(); 
    }
  } catch (err) { // Catch for network errors or other unexpected issues with useFetch itself
    console.error('Network or fetch setup error updating dream title:', err);
    toast.add({ severity: 'error', summary: 'Network Error', detail: 'Could not reach server to update title.', life: 3000 });
  }
  
  // Close edit mode regardless of success/failure for this attempt
  // User can re-try if it failed.
  editingDreamId.value = null;
  editingTitle.value = '';
}

function cancelEditDreamTitle() {
  editingDreamId.value = null;
  editingTitle.value = '';
}
// --------------------------------

// State for dreams list - Initialize from localStorage
const isDreamsOpen = ref(false); 

// Fetch saved dreams
const { data: savedDreams, pending, error, refresh } = useFetch<Dream[]>('/api/dreams', { 
  lazy: true, 
  default: () => [],
  watch: [status] // Restore watch for status
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

// --- Function to handle creating a new dream ---
function handleAddNewDream() {
  if (tagStore.hasUnsavedChanges) {
    console.log('Unsaved changes detected');
    confirm.require({
      message: 'You have unsaved changes. Do you want to save them before starting a new dream?',
      header: 'Unsaved Changes',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Save & Start New',
      rejectLabel: 'Start New Without Saving',
      accept: async () => {
        console.log('Save & Start New selected');
        // Assuming a save function exists or will be implemented in the store
        // await tagStore.saveCurrentDream(); 
        console.warn('Programmatic saving before new dream not implemented yet. Starting new without saving.');
        tagStore.resetToCurrentSession({isNewDream: true});
        // Ensure the dreams list stays open or opens if it was closed by an action
        isDreamsOpen.value = true; 
      },
      reject: () => {
        console.log('Start New Without Saving selected');
        tagStore.resetToCurrentSession({isNewDream: true});
        isDreamsOpen.value = true;
      }
    });
  } else {
    // No unsaved changes, proceed directly
    tagStore.resetToCurrentSession({isNewDream: true});
    isDreamsOpen.value = true;
  }
}
// ---------------------------------------------

// --- Updated Function to Load Dream State with Confirmation ---
function loadDream(dream: Dream | null) {
  const targetDreamId = dream ? dream.id : null;
  console.log('Loading Dream ID:', targetDreamId);
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
        } else if (dream === null) {
            console.log("Resetting to Current Session");
            tagStore.resetToCurrentSession(); // Use the reset action
        } else {
            console.error("Attempted to load invalid dream data", dream);
        }
    } else {
        console.log("Clicked already active dream. Closing list.");
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
  width: 280px;
  background-color:  rgb(16 13 44 / 70%);
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    &.active {
      background-color: rgba(79, 70, 229, 0.7); // Active item highlight (Tailwind indigo-600 equivalent with alpha)
      color: white;
      font-weight: 600;
      box-shadow: 0 4px 10px rgba(79,70,229,0.3);

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
        background-color: rgba(0,0,0,0.1); // Slight background for better visibility on hover state
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
     .loading, .error, .empty {
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
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