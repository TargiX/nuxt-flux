<template>
  <div class="flex items-center justify-center min-h-screen bg-transparent z-10">
    <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Reset Your Password</h2>
      </div>
      <form v-if="!successMessage" class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div
          v-if="error"
          class="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
          role="alert"
        >
          {{ error }}
        </div>
        <div class="space-y-4">
          <div>
            <label for="password" class="sr-only">New Password</label>
            <Password
              id="password"
              v-model="password"
              required
              class="w-full"
              placeholder="New Password"
              toggle-mask
              :feedback="true"
            />
          </div>
          <div>
            <label for="confirmPassword" class="sr-only">Confirm New Password</label>
            <Password
              id="confirmPassword"
              v-model="confirmPassword"
              required
              class="w-full"
              placeholder="Confirm New Password"
              toggle-mask
              :feedback="false"
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            label="Reset Password"
            class="w-full"
            :loading="loading"
            :disabled="loading"
          />
        </div>
      </form>
      <div v-if="successMessage" class="text-center">
        <p
          class="p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800"
        >
          {{ successMessage }}
        </p>
        <NuxtLink
          to="/login"
          class="mt-4 inline-block font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Proceed to Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
})

interface ResetPasswordResponse {
  message: string
}

const route = useRoute()
const token = ref<string | null>(null)

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

onMounted(() => {
  if (typeof route.query.token === 'string' && route.query.token) {
    token.value = route.query.token
  } else {
    error.value = 'No reset token found. Please request a new link.'
  }
})

async function handleSubmit() {
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (!token.value) {
    error.value = 'Missing reset token.'
    return
  }

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const { data, error: fetchError } = await useFetch<ResetPasswordResponse>(
      '/api/auth/reset-password',
      {
        method: 'POST',
        body: {
          token: token.value,
          password: password.value,
        },
      }
    )

    if (fetchError.value) {
      throw fetchError.value
    }

    if (data.value) {
      successMessage.value = data.value.message
    }
  } catch (e: unknown) {
    let errorMessage = 'An unexpected error occurred. Please try again.'
    if (
      e &&
      typeof e === 'object' &&
      'data' in e &&
      e.data &&
      typeof e.data === 'object' &&
      'statusMessage' in e.data
    ) {
      errorMessage = (e.data as { statusMessage: string }).statusMessage
    }
    error.value = errorMessage
  } finally {
    loading.value = false
  }
}
</script>
