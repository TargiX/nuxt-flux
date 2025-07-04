<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-center text-white">Forgot Password</h2>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300">Email Address</label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'p-invalid': emailError }"
            aria-describedby="email-error"
          />
          <small v-if="emailError" id="email-error" class="p-error">{{ emailError }}</small>
        </div>
        <Button
          type="submit"
          label="Send Reset Link"
          :loading="loading"
          class="w-full py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        />
      </form>
      <div class="text-center">
        <NuxtLink to="/login" class="text-sm text-blue-400 hover:underline">Back to Login</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const email = ref('')
const loading = ref(false)
const emailError = ref('')

const handleSubmit = async () => {
  loading.value = true
  emailError.value = ''

  try {
    const { data } = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value },
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: data?.message || 'Password reset link sent successfully',
      life: 5000,
    })

    email.value = ''
  } catch (error: any) {
    console.error('Forgot password error:', error)
    
    if (error.data?.errors) {
      const emailErr = error.data.errors.find((err: any) => err.field === 'email')
      if (emailErr) {
        emailError.value = emailErr.message
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.data?.message || 'Failed to send reset link',
        life: 5000,
      })
    }
  } finally {
    loading.value = false
  }
}

useSeoMeta({
  title: 'Forgot Password - DreamSeed',
  description: 'Reset your DreamSeed account password',
})
</script>