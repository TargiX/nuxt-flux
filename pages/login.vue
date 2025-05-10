<template>
  <div class="login-container">
    <Card class="login-card">
      <template #title>
        <h2 class="title">Sign In</h2>
      </template>
      <template #content>
        <form @submit.prevent="handleLogin">
          <div class="form-container">
            <div class="form-field">
              <label for="email">Email</label>
              <InputText id="email" type="email" v-model="email" required />
              <small class="field-help">Enter your registered email address.</small>
            </div>
            <div class="form-field">
              <label for="password">Password</label>
              <Password id="password" v-model="password" required toggleMask :feedback="false" />
            </div>
            
            <div v-if="errorMsg" class="form-field">
              <Message severity="error" :closable="false">{{ errorMsg }}</Message>
            </div>

            <div class="form-field">
              <Button label="Sign In" type="submit" :loading="loading" class="w-full submit-button" />
            </div>
          </div>
        </form>
      </template>
       <template #footer>
         <div class="text-center">
            Don't have an account?
            <NuxtLink to="/register" class="sign-up-link">Register here</NuxtLink>
         </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Use nuxt-auth composable
const { signIn } = useAuth()

// Page meta
definePageMeta({
  layout: 'auth', // Assuming you might want a different layout for auth pages
  auth: {
    unauthenticatedOnly: true, // Redirect if already logged in
    navigateAuthenticatedTo: '/', // Where to redirect if logged in
  }
})

// Component state
const email = ref('')
const password = ref('')
const errorMsg = ref<string | null>(null)
const loading = ref(false)

// Handle login submission
const handleLogin = async () => {
  loading.value = true
  errorMsg.value = null

  try {
    const result = await signIn('credentials', {
      email: email.value,
      password: password.value,
      redirect: false // Handle redirect manually or based on result
    })

    if (result?.error) {
      // Handle error from the authorize function (e.g., invalid credentials)
      // See: https://sidebase.io/nuxt-auth/application-side/sign-in-out#handling-errors-manually
      console.error('Login Error:', result.error)
      errorMsg.value = 'Invalid email or password. Please try again.' // Generic error message
    } else if (result?.ok) {
      // Login successful, redirect to home or intended page
      console.log('Login successful')
      // Nuxt-auth middleware might handle redirection if configured,
      // or redirect manually:
      await navigateTo('/', { external: true })
    } else {
       // Handle other potential issues
       console.error('Login failed with unknown status:', result)
       errorMsg.value = 'An unexpected error occurred. Please try again.'
    }

  } catch (err) {
    console.error('Login Submit Error:', err)
    errorMsg.value = 'An error occurred during login. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 450px;
  
  :deep(.p-card-title) {
    padding: 0;
  }

  :deep(.p-card-content) {
    padding-top: 0;
  }

  .title {
    font-size: 1.75rem;
    font-weight: 600;
    margin: 0 0 1rem;
    color: #1e293b;
  }
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  
  label {
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: #374151;
  }

  :deep(.p-password) {
    width: 100%;
    
    input {
      width: 100%;
    }
    
    .p-password-input {
      width: 100%;
    }
    
    .p-inputtext {
      width: 100%;
    }
  }

  .field-help {
    margin-top: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
  }
}

.submit-button {
  margin-top: 0.5rem;
  height: 2.75rem;
  font-weight: 500;
}

.sign-up-link {
  color: #6366f1;
  font-weight: 500;
  transition: color 0.2s;
  
  &:hover {
    color: #4f46e5;
    text-decoration: underline;
  }
}
</style> 