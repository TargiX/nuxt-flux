import { ref, watch, onMounted, type Ref } from 'vue';
import type { Dream } from '~/types/dream';
import { useTagStore } from '~/store/tagStore';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
// Menu component instance methods like .toggle() are handled by passing the ref from the calling component

export function useDreamManagement() {
  const tagStore = useTagStore();
  const confirm = useConfirm();
  const toast = useToast();

  // --- State for dreams list ---
  const isDreamsOpen = ref(false);

  // Watch for changes and save to localStorage
  watch(isDreamsOpen, (newValue) => {
    localStorage.setItem('dreamsListOpen', String(newValue));
  });
  // -----------------------------

  // --- Fetch saved dreams ---
  const { data: savedDreams, pending, error, refresh: refreshDreamsListAPI } = useFetch<Dream[]>('/api/dreams', { 
    lazy: true, 
    default: () => [],
    // Watch status from useAuth() to refetch if auth status changes.
    // This needs useAuth() to be available or passed if we want to keep it here.
    // For now, assuming it's implicitly handled or we rely on manual refresh triggers.
    // If status is critical for auto-refresh, useAuth() would need to be called here.
    // Let's get status from useAuth to ensure this works as before.
    // const { status: authStatus } = useAuth(); // Assuming useAuth() can be called here
    // watch: [authStatus] // This would require useAuth() in the composable.
    // For simplicity now, we'll rely on manual refresh or initial load.
    // The original code had `watch: [status]` where status came from useAuth in default.vue
  });
  // --------------------------

  // --- Inject refresh function into the store & load localStorage state for isDreamsOpen ---
  onMounted(() => {
    if (refreshDreamsListAPI) {
      tagStore.setDreamsListRefresher(refreshDreamsListAPI);
    }
    const storedState = localStorage.getItem('dreamsListOpen');
    isDreamsOpen.value = storedState === 'true';
  });
  // ------------------------------------------------------------------------------------

  // --- Dream Actions Menu & Inline Editing State ---
  const selectedDreamForMenu = ref<Dream | null>(null); // Tracks which dream's menu is targeted
  const editingDreamId = ref<number | null>(null);
  const editingTitle = ref('');

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
    // Future actions: Delete, Duplicate, etc.
  ]);
  // ----------------------------------------------

  // --- Functions for Menu and Inline Editing ---
  function toggleDreamActionMenu(event: MouseEvent, dream: Dream, menuComponent: any) {
    selectedDreamForMenu.value = dream; // Set context for menu items
    if (menuComponent && typeof menuComponent.toggle === 'function') {
      menuComponent.toggle(event);
    } else {
      console.warn('Menu component or toggle function not provided to toggleDreamActionMenu');
    }
  }

  function startEditingDreamTitle(dream: Dream) {
    editingDreamId.value = dream.id;
    editingTitle.value = dream.title || '';
  }

  async function saveDreamTitle(dream: Dream) {
    if (editingDreamId.value === null || !dream) return;
    const originalTitle = dream.title;
    const newTitle = editingTitle.value.trim();

    if (!newTitle) {
      toast.add({ severity: 'warn', summary: 'Validation', detail: 'Title cannot be empty.', life: 3000 });
      editingTitle.value = originalTitle || '';
      return; 
    }

    if (newTitle === originalTitle) {
      editingDreamId.value = null;
      editingTitle.value = '';
      return;
    }

    try {
      const { data: updatedDreamData, error: fetchError } = await useFetch(`/api/dreams/${dream.id}`, {
        method: 'PUT',
        body: { title: newTitle },
        watch: false 
      });

      if (fetchError.value) {
        toast.add({ severity: 'error', summary: 'Error', detail: fetchError.value.data?.message || 'Could not update title.', life: 3000 });
      } else if (updatedDreamData.value) {
        toast.add({ severity: 'success', summary: 'Success', detail: 'Dream title updated!', life: 3000 });
        if (savedDreams.value) {
          const dreamInList = savedDreams.value.find(d => d.id === dream.id);
          if (dreamInList) {
            dreamInList.title = (updatedDreamData.value as Dream).title;
          }
        }
      }
    } catch (err) {
      console.error('Network or fetch setup error updating dream title:', err);
      toast.add({ severity: 'error', summary: 'Network Error', detail: 'Could not reach server to update title.', life: 3000 });
    }
    
    editingDreamId.value = null;
    editingTitle.value = '';
  }

  function cancelEditDreamTitle() {
    editingDreamId.value = null;
    editingTitle.value = '';
  }
  // -----------------------------------------

  // --- Core Dream Operations ---
  function proceedWithLoad(dream: Dream | null) { // Internal helper
    const targetDreamId = dream ? dream.id : null;
    if (targetDreamId !== tagStore.loadedDreamId) {
      if (dream && dream.data) {
        tagStore.loadDreamState(dream.data, dream.id); 
      } else if (dream === null) {
        tagStore.resetToCurrentSession({isNewDream: false}); // Resetting to an existing "current" session
      }
    } else {
    }
  }

  function loadDream(dream: Dream | null) {
    const targetDreamId = dream ? dream.id : null;
    if (tagStore.hasUnsavedChanges && tagStore.loadedDreamId !== targetDreamId) {
      confirm.require({
        message: 'You have unsaved changes. Do you want to save them before loading the new dream?',
        header: 'Unsaved Changes',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Save & Load',
        rejectLabel: 'Load Without Saving',
        accept: async () => {
          // Placeholder for actual save logic if it were to be implemented here
          console.warn('Programmatic saving before load not implemented in composable. Loading without saving.');
          proceedWithLoad(dream);
        },
        reject: () => {
          proceedWithLoad(dream);
        }
      });
    } else {
      proceedWithLoad(dream);
    }
  }
  
  function handleAddNewDream() {
    const performReset = () => {
      tagStore.resetToCurrentSession({isNewDream: true}); // Explicitly a new dream
      isDreamsOpen.value = true; 
    };

    if (tagStore.hasUnsavedChanges) {
      confirm.require({
        message: 'You have unsaved changes. Do you want to save them before starting a new dream?',
        header: 'Unsaved Changes',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Save & Start New',
        rejectLabel: 'Start New Without Saving',
        accept: async () => {
          console.warn('Programmatic saving before new dream not implemented in composable. Starting new without saving.');
          performReset();
        },
        reject: () => {
          performReset();
        }
      });
    } else {
      performReset();
    }
  }
  // --------------------------

  // --- Save Dream Operations ---
  const isSavingDream = ref(false); // Add a ref to track saving state if needed by other parts of the composable or UI

  // Helper function to handle save errors (can be used by multiple save operations)
  function handleSaveError(error: any, operation: string, toastInstance: any) { // Pass toast instance
    console.error(`Error ${operation} dream:`, error);
    let errorMessage = `Could not ${operation} dream due to an unknown error.`;
    if (error.data && error.data.message) {
      errorMessage = error.data.message;
      if (error.data.code === 'VALIDATION_FAILED' && error.data.errors) {
        errorMessage = error.data.errors.map((e: any) => `${e.field}: ${e.message}`).join('; ');
      }
    } else if (error.statusMessage) {
      errorMessage = error.statusMessage;
    }
    // Use the passed toast instance
    toastInstance.add({ severity: 'error', summary: `${operation.charAt(0).toUpperCase() + operation.slice(1)} Failed`, detail: errorMessage, life: 5000 });
    // Note: saveStatus ref is local to TagCloud.vue, if a similar status is needed here, it should be handled within the composable's state.
  }

  // Function to perform the save (for new or save as new)
  async function performSaveAsNew(dreamDataPayload: any, toastInstance: any, tagStoreInstance: any, title?: string) { // Pass toast and tagStore
    isSavingDream.value = true;
    let newDreamResponse = null;
    try {
      newDreamResponse = await $fetch<any>('/api/dreams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dreamDataPayload,
          // title: title, // Title handling can be more complex if it's part of the payload vs. separate logic
        })
      });
      console.log('New dream saved successfully via composable:', newDreamResponse);
      // toastInstance.add({ severity: 'success', summary: 'Success', detail: 'New dream saved successfully!', life: 3000 });
      
      // IMPORTANT: Update store to reflect this newly saved dream as the current one
      tagStoreInstance.loadDreamState(newDreamResponse.data, newDreamResponse.id);
      tagStoreInstance.refreshDreamsList(); // This should ideally call the refreshDreamsListAPI from this composable
      
      return newDreamResponse; // Return the saved dream data
    } catch (error: any) {
      handleSaveError(error, 'save as new', toastInstance);
      return null; // Indicate failure
    } finally {
      isSavingDream.value = false;
    }
  }

  async function initiateSaveDreamProcess(dreamDataPayload: any) {
    if (isSavingDream.value) return; // Prevent multiple saves

    const currentLoadedDreamId = tagStore.loadedDreamId; // Get current dream ID from store

    if (currentLoadedDreamId !== null) {
      confirm.require({
        message: 'This dream already exists. How would you like to save your changes?',
        header: 'Confirm Save Action',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Update Existing',
        rejectLabel: 'Save as New Dream',
        accept: async () => {
          isSavingDream.value = true;
          try {
            // NOTE: The API endpoint and method for update might need adjustment.
            // Current TagCloud.vue uses POST to /api/dreams with dreamIdToUpdate in body.
            // A more RESTful approach would be PUT to /api/dreams/:id.
            // Assuming the current backend handles the POST for updates.
            const updatedDream = await $fetch<any>('/api/dreams', {
              method: 'POST', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dreamIdToUpdate: currentLoadedDreamId,
                data: dreamDataPayload,
              })
            });
            console.log('Dream updated successfully via composable:', updatedDream);
            toast.add({ severity: 'success', summary: 'Success', detail: 'Dream updated successfully!', life: 3000 });
            tagStore.markAsSaved();
            if (refreshDreamsListAPI) refreshDreamsListAPI(); // Refresh using the composable's own refresher
          } catch (error: any) {
            handleSaveError(error, 'update', toast); // Use existing error handler
          } finally {
            isSavingDream.value = false;
          }
        },
        reject: async () => {
          // User chose to SAVE AS NEW dream (from an existing one)
          // performSaveAsNew already sets isSavingDream true/false
          await performSaveAsNew(dreamDataPayload, toast, tagStore);
        },
      });
    } else {
      // It's a NEW dream (loadedDreamId is null), save it directly
      // performSaveAsNew already sets isSavingDream true/false
      await performSaveAsNew(dreamDataPayload, toast, tagStore);
    }
  }
  // --------------------------

  return {
    // State
    isDreamsOpen,
    savedDreams,
    pending,
    error,
    menuItems, // For the Menu component
    editingDreamId,
    editingTitle,
    isSavingDream, // Expose if needed externally

    // Functions
    refreshDreamsListAPI, // Expose the refresh function from useFetch
    handleAddNewDream,
    loadDream,
    toggleDreamActionMenu,
    startEditingDreamTitle,
    saveDreamTitle,
    cancelEditDreamTitle,
    performSaveAsNew,     // EXPORT
    initiateSaveDreamProcess, // EXPORT NEW FUNCTION
    // handleSaveError is internal to the composable but used by performSaveAsNew
  };
} 