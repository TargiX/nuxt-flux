<template>
  <div class="flex items-center justify-center min-h-screen bg-transparent z-10">
    <div class="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div class="text-center">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Enter your email and we'll send you a link to reset your password.
        </p>
      </div>
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div
          v-if="message"
          class="p-4 text-sm text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800"
          role="alert"
        >
          {{ message }}
        </div>
        <div
          v-if="error"
          class="p-4 text-sm text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800"
          role="alert"
        >
          {{ error }}
        </div>
        <div class="space-y-4">
          <div>
            <label for="email" class="sr-only">Email address</label>
            <InputText
              id="email"
              v-model="email"
              type="email"
              required
              class="w-full"
              placeholder="Email address"
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            label="Send Reset Link"
            class="w-full"
            :loading="loading"
            :disabled="loading"
          />
        </div>
      </form>
      <div class="text-sm text-center">
        <NuxtLink
          to="/login"
          class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Back to login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  },
})

interface ForgotPasswordResponse {
  message: string
}

const email = ref('')
const loading = ref(false)
const message = ref('')
const error = ref('')

async function handleSubmit() {
  loading.value = true
  message.value = ''
  error.value = ''

  try {
    const { data, error: fetchError } = await useFetch<ForgotPasswordResponse>(
      '/api/auth/forgot-password',
      {
        method: 'POST',
        body: { email: email.value },
      }
    )

    if (fetchError.value) {
      throw fetchError.value
    }

    if (data.value) {
      message.value = data.value.message
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
