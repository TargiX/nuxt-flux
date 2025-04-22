<template>
  <div class="register-container">
    <Card class="register-card">
      <template #title>
        Create Account
      </template>
      <template #content>
        <form @submit.prevent="handleRegister">
          <div class="p-fluid grid formgrid">
            <div class="field col-12">
              <label for="name">Name</label>
              <InputText id="name" type="text" v-model="name" />
            </div>
            
            <div class="field col-12">
              <label for="email">Email</label>
              <InputText id="email" type="email" v-model="email" required aria-describedby="email-help" />
              <small id="email-help">You'll use this email to sign in.</small>
            </div>
            
            <div class="field col-12">
              <label for="password">Password</label>
              <Password id="password" v-model="password" required toggleMask :feedback="true" />
              <small>Use at least 8 characters with a mix of letters, numbers & symbols.</small>
            </div>
            
            <div v-if="errorMsg" class="field col-12">
              <Message severity="error" :closable="false">{{ errorMsg }}</Message>
            </div>
            
            <div v-if="successMsg" class="field col-12">
              <Message severity="success" :closable="false">{{ successMsg }}</Message>
            </div>

            <div class="field col-12">
              <Button label="Create Account" type="submit" :loading="loading" class="w-full" />
            </div>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="text-center">
          Already have an account? 
          <NuxtLink to="/login">Sign in here</NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// No need to import PrimeVue components here - they're automatically imported

// Page meta
definePageMeta({
  layout: 'auth',
  auth: {
    unauthenticatedOnly: true,
    navigateAuthenticatedTo: '/',
  }
})

// Component state
const name = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const loading = ref(false)

// Handle registration submission
const handleRegister = async () => {
  loading.value = true
  errorMsg.value = null
  successMsg.value = null

  try {
    // Call the register API endpoint
    const { data, error } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value
      }
    })

    if (error.value) {
      // If the API returned an error
      errorMsg.value = error.value.statusMessage || 'Registration failed. Please try again.'
      console.error('Register Error:', error.value)
    } else {
      // Registration successful
      successMsg.value = 'Account created successfully! Redirecting to login...'
      
      // Reset form
      name.value = ''
      email.value = ''
      password.value = ''
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigateTo('/login')
      }, 2000)
    }
  } catch (err) {
    // Unexpected error
    console.error('Registration Error:', err)
    errorMsg.value = 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 2rem;
}

.register-card {
  width: 100%;
  max-width: 450px;
}
</style> 