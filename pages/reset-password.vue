<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-center text-white">Reset Password</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300">New Password</label>
          <InputText
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'p-invalid': passwordError }"
            aria-describedby="password-error"
          />
          <small v-if="passwordError" id="password-error" class="p-error">{{ passwordError }}</small>
        </div>
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300">Confirm New Password</label>
          <InputText
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'p-invalid': confirmPasswordError }"
            aria-describedby="confirmPassword-error"
          />
          <small v-if="confirmPasswordError" id="confirmPassword-error" class="p-error">{{ confirmPasswordError }}</small>
        </div>
        <Button
          type="submit"
          label="Reset Password"
          :loading="loading"
          class="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const route = useRoute();
const router = useRouter();
const toast = useToast();

const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const passwordError = ref<string | null>(null);
const confirmPasswordError = ref<string | null>(null);

const token = route.query.token as string;

// Redirect if no token is present
if (!token) {
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: 'Password reset token is missing.',
    life: 5000,
  });
  router.replace('/forgot-password');
}

const handleSubmit = async () => {
  passwordError.value = null;
  confirmPasswordError.value = null;

  if (password.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters long.';
    return;
  }

  if (password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match.';
    return;
  }

  loading.value = true;

  try {
    const response = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password: password.value },
    });
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: response.message,
      life: 5000,
    });
    router.replace('/login'); // Redirect to login after successful reset
  } catch (error: any) {
    console.error('Reset password error:', error);
    passwordError.value = error.data?.message || 'An unexpected error occurred.';
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: passwordError.value,
      life: 5000,
    });
  } finally {
    loading.value = false;
  }
};

useHead({
  title: 'Reset Password',
});
</script>

<style scoped>
/* Add any specific styles for this page here if needed */
</style>