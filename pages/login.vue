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
              <div class="text-right mt-1">
                <NuxtLink to="/forgot-password" class="text-sm text-blue-400 hover:underline">Forgot password?</NuxtLink>
              </div>
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
          Don't have an account?
          <NuxtLink to="/register" class="sign-up-link">Register here</NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter, reloadNuxtApp, navigateTo } from '#app'

// Initialize auth composable
const { signIn, status, updateSession, session } = useAuth()

// Page meta
definePageMeta({
  layout: 'auth',
})

// Component state
const email = ref('')
const password = ref('')
const loading = ref(false)
const googleLoading = ref(false);
const errorMsg = ref<string | null>(null)

// Handle redirect for already authenticated users
if (status.value === 'authenticated') {
  const route = useRoute()
  const redirectPath = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') 
                        ? route.query.redirect 
                        : '/';
  await navigateTo(redirectPath, { replace: true });
}

const handleLogin = async () => {
  loading.value = true;
  errorMsg.value = null;

  try {
    // 1. send credentials without redirect
    const res = await signIn('credentials', {
      email: email.value,
      password: password.value,
      redirect: false // stay on page
    }) as Response // signIn with redirect:false returns a Response

    if (!res.ok) {
      /* error payload from Auth.js: { error: 'CredentialsSignin' | ... } */
      // Try to parse JSON for an error object, otherwise use statusText
      let errorDetail = `HTTP error ${res.status}: ${res.statusText}`;
      try {
        const errorBody = await res.json();
        errorDetail = errorBody.error || errorDetail;
      } catch (e) {
        // JSON parsing failed, stick with statusText or a generic message
      }
      
      errorMsg.value = errorDetail === 'CredentialsSignin'
        ? 'Invalid email or password.'
        : `Login failed: ${errorDetail}`;
      return;
    }

    // 2. cookie is now in the browser – hydrate Nuxt auth state once
    try {
      // Attempt to get session data from response if backend sends it (often not for credentials)
      // If res.json() fails or returns empty, it will be caught.
      const freshSessionData = await res.json(); 
      console.log(`[LOGIN] Response JSON parsed:`, freshSessionData)
      
      if (freshSessionData && Object.keys(freshSessionData).length > 0) {
        console.log(`[LOGIN] Valid session data found. Calling updateSession...`)
        await updateSession(freshSessionData); // Update the session store with new data
        console.log(`[LOGIN] updateSession completed. New status: ${status.value}, Session exists: ${!!session.value}`)
      } else {
        console.log(`[LOGIN] No meaningful session data in response. Calling reloadNuxtApp...`)
        // If no meaningful session data in response, force reload to pick up cookie
        // This is a common pattern if the credentials endpoint only sets a cookie.
        reloadNuxtApp({ persistState: true, force: true });
        return; // reloadNuxtApp will stop current execution flow
      }
    } catch (e) {
      console.log(`[LOGIN] Failed to parse response JSON or updateSession failed:`, e)
      // Fallback: if res.json() fails (e.g. empty response which is valid for 200 OK)
      // or if updateSession itself has issues, force-reload to pick up cookie.
      console.log(`[LOGIN] Calling reloadNuxtApp as fallback...`)
      reloadNuxtApp({ persistState: true, force: true });
      return; // reloadNuxtApp will stop current execution flow
    }
    // If updateSession was successful and we didn't reload, the watch(status) will navigate
    console.log(`[LOGIN] Login process completed without reload. Status: ${status.value}, Session exists: ${!!session.value}`)

  } catch (e: any) {
    // Catch errors from signIn itself (network issues, etc.)
    console.error('[LOGIN] Credentials Sign-In Main Catch Block:', e);
    errorMsg.value = e.message || 'An unexpected error occurred during login.';
  } finally {
    loading.value = false;
    console.log(`[LOGIN] Login process finished. Final status: ${status.value}, Session exists: ${!!session.value}`)
  }
};

const handleGoogleSignIn = async () => {
  console.log(`[LOGIN] Starting Google OAuth login`)
  googleLoading.value = true;
  errorMsg.value = null;
  try {
    await signIn('google'); // Defaults to redirect: true
    // OAuth flow will redirect away and then back. Watch(status,...) handles post-login.
    console.log(`[LOGIN] Google signIn completed (should redirect)`)
  } catch (err: any) {
    console.error('[LOGIN] Google Sign-In Error:', err);
    errorMsg.value = err.message || 'An error occurred during Google Sign-In.';
    googleLoading.value = false;
  }
};

const route = useRoute();
const router = useRouter();

watch(status, (newStatus, oldStatus) => {
  console.log(`[LOGIN WATCH] Status changed from ${oldStatus} to ${newStatus}. Session exists: ${!!session.value}`)
  if (newStatus === 'authenticated') {
    const redirect = route.query.redirect;
    if (typeof redirect === 'string' && redirect.startsWith('/')) {
      console.log(`[LOGIN WATCH] Authenticated! Navigating to stored path: ${redirect}`)
      navigateTo(redirect, { replace: true, external: false });
    } else {
      console.log(`[LOGIN WATCH] Authenticated! Navigating to default path: /`)
      navigateTo('/', { replace: true, external: false });
    }
  }
}, { immediate: false }); // Set immediate to true if you want to check on component mount too
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