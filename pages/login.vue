<template>
  <div class="login-container">
    <Card class="login-card">
      <template #title>
        Sign In
      </template>
      <template #content>
        <form @submit.prevent="handleLogin">
          <div class="p-fluid grid formgrid">
            <div class="field col-12">
              <label for="email">Email</label>
              <InputText id="email" type="email" v-model="email" required aria-describedby="email-help" />
              <small id="email-help">Enter your registered email address.</small>
            </div>
            <div class="field col-12">
              <label for="password">Password</label>
              <Password id="password" v-model="password" required toggleMask :feedback="false" />
            </div>

            <div v-if="errorMsg" class="field col-12">
              <Message severity="error" :closable="false">{{ errorMsg }}</Message>
            </div>

            <div class="field col-12">
              <Button label="Sign In" type="submit" :loading="loading" class="w-full" />
            </div>
          </div>
        </form>
      </template>
       <template #footer>
         <div class="text-center">
            Don't have an account?
            <NuxtLink to="/register">Register here</NuxtLink>
         </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// Remove PrimeVue component imports - rely on @primevue/nuxt-module auto-import
// import InputText from 'primevue/inputtext';
// import Password from 'primevue/password';
// import Button from 'primevue/button';
// import Card from 'primevue/card';
// import Message from 'primevue/message';

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
  min-height: calc(100vh - 100px); // Adjust based on your header/footer height if using auth layout
  padding: 2rem;
}

.login-card {
  width: 100%;
  max-width: 450px; // Limit card width
}

/* Add any additional styling needed */
</style> 