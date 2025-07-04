<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-center text-white">Reset Password</h2>
      
      <div v-if="!token" class="text-center">
        <p class="text-red-400 mb-4">Invalid or missing reset token.</p>
        <NuxtLink to="/forgot-password" class="text-blue-400 hover:underline">Request a new reset link</NuxtLink>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300">New Password</label>
          <InputText
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'p-invalid': passwordError }"
            aria-describedby="password-error"
          />
          <small v-if="passwordError" id="password-error" class="p-error">{{ passwordError }}</small>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300">Confirm Password</label>
          <InputText
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            class="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            :class="{ 'p-invalid': confirmPasswordError }"
            aria-describedby="confirm-password-error"
          />
          <small v-if="confirmPasswordError" id="confirm-password-error" class="p-error">{{ confirmPasswordError }}</small>
        </div>

        <Button
          type="submit"
          label="Reset Password"
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
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useRouter, useRoute } from 'vue-router'

const toast = useToast()
const router = useRouter()
const route = useRoute()

const token = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const passwordError = ref('')
const confirmPasswordError = ref('')

const isPasswordValid = computed(() => password.value.length >= 8)
const doPasswordsMatch = computed(() => password.value === confirmPassword.value)

onMounted(() => {
  token.value = route.query.token as string || ''
})

const validateForm = () => {
  passwordError.value = ''
  confirmPasswordError.value = ''

  if (!isPasswordValid.value) {
    passwordError.value = 'Password must be at least 8 characters long'
    return false
  }

  if (!doPasswordsMatch.value) {
    confirmPasswordError.value = 'Passwords do not match'
    return false
  }

  return true
}

const handleSubmit = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const { data } = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value,
      },
    })

    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: data?.message || 'Password reset successfully',
      life: 5000,
    })

    // Redirect to login after successful reset
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (error: any) {
    console.error('Reset password error:', error)
    
    if (error.data?.errors) {
      const passwordErr = error.data.errors.find((err: any) => err.field === 'password')
      if (passwordErr) {
        passwordError.value = passwordErr.message
      }
    } else {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.data?.message || 'Failed to reset password',
        life: 5000,
      })
    }
  } finally {
    loading.value = false
  }
}

useSeoMeta({
  title: 'Reset Password - DreamSeed',
  description: 'Set a new password for your DreamSeed account',
})
</script>