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
              <InputText id="email" type="email" v-model="email" required  />
              <small class="field-help">Enter your registered email address.</small>
            </div>
            <div class="form-field w-full">
              <label for="password">Password</label>
              <Password :inputStyle="{ width: '100%' }"  id="password" v-model="password" required toggleMask :feedback="false"  />
            </div>

            <div v-if="errorMsg" class="form-field">
              <Message severity="error" :closable="false" class="error-message">{{ errorMsg }}</Message>
            </div>

            <div class="form-field">
              <Button label="Sign In" type="submit" :loading="loading" class="btn-primary" />
            </div>

            <div class="social-login-divider">
              <span class="divider-line"></span>
              <span class="divider-text">Or continue with</span>
              <span class="divider-line"></span>
            </div>

            <div class="form-field">
              <Button 
                label="Sign in with Google" 
                icon="pi pi-google" 
                @click="handleGoogleSignIn" 
                :loading="googleLoading"
                class="btn-secondary"
              />
            </div>
          </div>
        </form>
      </template>
      <template #footer>
        <div class="footer-text">
          Don’t have an account?
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
const googleLoading = ref(false); // Added for Google button

// Handle login submission
const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = null;

  try {
    const result = await signIn('credentials', {
      email: email.value,
      password: password.value,
      redirect: false,
    });

    if (result && result.ok) {
      console.log('Login successful');
      await navigateTo('/');
    } else {
      // Handle error cases
      let specificError = 'Unknown error';
      if (result && typeof (result as any).error === 'string') {
        specificError = (result as any).error;
      }
      
      console.error('Login failed. Result:', result, 'Specific error code:', specificError);

      if (specificError === 'CredentialsSignin') {
        errorMsg.value = 'Invalid email or password. Please try again.';
      } else if (specificError !== 'Unknown error') {
        errorMsg.value = `Login failed: ${specificError}`;
      } else {
        errorMsg.value = 'An unexpected error occurred during login. Please check credentials.';
      }
    }
  } catch (err) {
    console.error('Login Submit Error Catch Block:', err);
    // It's possible `err` itself contains useful info, but often it's a generic network error here
    errorMsg.value = 'An error occurred while trying to sign in. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Handle Google Sign-In
const handleGoogleSignIn = async () => {
  googleLoading.value = true;
  errorMsg.value = null; // Clear previous errors
  try {
    // Initiates the Google OAuth flow. This will typically redirect the user.
    // Nuxt-auth handles the callback and session creation.
    // The page guard (unauthenticatedOnly) should redirect upon successful login.
    await signIn('google');
    // If signIn completes without an immediate error/exception before redirect,
    // the user is likely being redirected. If it throws, catch block will handle.
    // We might not reach here if redirect happens.
  } catch (err: any) {
    console.error('Google Sign-In Invocation Error:', err);
    // Check if the error object has a message property
    const message = err.message || 'An error occurred while trying to sign in with Google.';
    errorMsg.value = message;
  } finally {
    googleLoading.value = false;
  }
};
</script>
<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  z-index: 2;
}

.login-card {
  position: relative;
  z-index: 0;            /* establish stacking context */
  overflow: hidden;      /* clip the oversized blur */
  background-color: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.3);
  width: 440px;
  padding: 2rem;

  &::before {
    content: '';
    position: absolute;
    inset: -50%;                       /* reach out beyond edges */
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    z-index: -1;                       /* sit behind all card content */
    /* remove any mask-image here unless intentional */
  }
}

.title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #d7e2f1;
  text-align: center;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #e9f1fb;
}

.input {
  width: 100%;
  height: 2.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem !important;
  padding: 0 0.75rem !important;
  font-size: 1rem;
}

.field-help {
  margin-top: 0.25rem;
  color: #b6bdcb;
  font-size: 0.875rem;
}

.error-message {
  margin-top: 0.5rem;
}

.btn-primary,
.btn-secondary {
  width: 100%;
  height: 3rem;
  font-weight: 500;
  border-radius: 0.5rem;
}

.btn-primary {
  background-color: #4f46e5 !important;
  border: none !important;
}

.btn-secondary {
  background-color: #f3f4f6 !important;
  color: #374151 !important;
  border: 1px solid #d1d5db !important;
}

.social-login-divider {
  display: flex;
  align-items: center;
  margin: 1rem 0;
  color: #6b7280;
  font-size: 0.875rem;

  .divider-line {
    flex: 1;
    height: 1px;
    background-color: #e5e7eb;
  }
  .divider-text {
    color: #b6bdcb;
    padding: 0 0.75rem;
  }
}

.footer-text {
  text-align: center;
  font-size: 0.875rem;
  color: #929dac;
  margin-top: 1rem;
}

.sign-up-link {
  color: #3caaff;
  font-weight: 500;
  margin-left: 0.25rem;
  transition: color 0.2s;
  &:hover {
    color: #46c3e5;
    text-decoration: underline;
  }
}
</style>