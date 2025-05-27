<template>
  <div class="register-container">
    <Card class="register-card">
      <template #title>
        <h2 class="title text-center">Create Account</h2>
      </template>
      <template #content>
        <form @submit.prevent="handleRegister">
          <div class="form-container">
            <div class="form-field">
              <label for="name">Name</label>
              <InputText id="name" type="text" v-model="name" />
            </div>
            
            <div class="form-field">
              <label for="email">Email</label>
              <div class="email-input-container">
                <InputText 
                  id="email" 
                  type="email" 
                  v-model="email" 
                  required 
                  @blur="checkEmailAvailability" 
                  :class="{ 'p-invalid': !!errorMsg && errorMsg.includes('email') }"
                />
                <i v-if="checkingEmail" class="pi pi-spin pi-spinner email-status-icon checking"></i>
                <i v-else-if="emailChecked && !emailError" class="pi pi-check-circle email-status-icon available"></i>
                <i v-else-if="emailError" class="pi pi-times-circle email-status-icon taken"></i>
              </div>
              <small class="field-help" v-if="!emailError">You'll use this email to sign in.</small>
              <small class="field-help error" v-else>{{ emailError }}</small>
            </div>
            
            <div class="form-field">
              <label for="password">Password</label>
              <Password id="password" v-model="password" required toggleMask :feedback="true" @input="checkPasswordStrength" />
              <small class="field-help">Use at least 8 characters with a mix of letters, numbers & symbols.</small>
              
              <!-- Password requirements checklist -->
              <div class="password-requirements" v-if="password.length > 0">
                <div class="requirement" :class="{ met: passwordChecks.length }">
                  <i class="pi" :class="passwordChecks.length ? 'pi-check-circle' : 'pi-times-circle'"></i>
                  <span>At least 8 characters</span>
                </div>
                <div class="requirement" :class="{ met: passwordChecks.hasLetter }">
                  <i class="pi" :class="passwordChecks.hasLetter ? 'pi-check-circle' : 'pi-times-circle'"></i>
                  <span>At least one letter</span>
                </div>
                <div class="requirement" :class="{ met: passwordChecks.hasNumber }">
                  <i class="pi" :class="passwordChecks.hasNumber ? 'pi-check-circle' : 'pi-times-circle'"></i>
                  <span>At least one number</span>
                </div>
                <div class="requirement" :class="{ met: passwordChecks.hasSpecial }">
                  <i class="pi" :class="passwordChecks.hasSpecial ? 'pi-check-circle' : 'pi-times-circle'"></i>
                  <span>At least one special character</span>
                </div>
              </div>
            </div>
            
            <div v-if="errorMsg" class="form-field">
              <Message severity="error" :closable="false">{{ errorMsg }}</Message>
            </div>
            
            <div v-if="successMsg" class="form-field">
              <Message severity="success" :closable="false">{{ successMsg }}</Message>
            </div>

            <div class="form-field">
              <Button label="Create Account" type="submit" :loading="loading" class="w-full submit-button" />
            </div>

            <div class="form-field social-login-divider">
              <span class="divider-line"></span>
              <span class="divider-text">Or sign up with</span>
              <span class="divider-line"></span>
            </div>

            <div class="form-field">
              <Button 
                label="Sign up with Google" 
                icon="pi pi-google" 
                @click="handleGoogleSignUp" 
                class="w-full p-button-secondary google-button" 
                :loading="googleLoading"
              />
            </div>

          </div>
        </form>
      </template>
      <template #footer>
        <div class="text-center">
          Already have an account? 
          <NuxtLink to="/login" class="sign-in-link">Sign in here</NuxtLink>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
// No need to import PrimeVue components here - they're automatically imported

// Use nuxt-auth composable
const { signIn, status } = useAuth()

// Page meta
definePageMeta({
  layout: 'auth',
})

// Component state
const name = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref<string | null>(null)
const successMsg = ref<string | null>(null)
const loading = ref(false)
const checkingEmail = ref(false)
const emailChecked = ref(false)
const emailError = ref<string | null>(null)
const googleLoading = ref(false)

// Watch for authentication status changes
watch(status, (newStatus) => {
  if (newStatus === 'authenticated') {
    navigateTo('/');
  }
}, { immediate: true });

// Password validation state
const passwordChecks = reactive({
  length: false,
  hasLetter: false,
  hasNumber: false,
  hasSpecial: false
})

// Check password as user types
const checkPasswordStrength = () => {
  const pass = password.value
  
  // Update validation state
  passwordChecks.length = pass.length >= 8
  passwordChecks.hasLetter = /[a-zA-Z]/.test(pass)
  passwordChecks.hasNumber = /\d/.test(pass)
  passwordChecks.hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
}

// Password validation function
const validatePassword = (pass: string): { valid: boolean; message: string } => {
  if (!passwordChecks.length) {
    return { 
      valid: false, 
      message: 'Password must be at least 8 characters long' 
    }
  }
  
  if (!passwordChecks.hasLetter) {
    return { 
      valid: false, 
      message: 'Password must include at least one letter' 
    }
  }
  
  if (!passwordChecks.hasNumber) {
    return { 
      valid: false, 
      message: 'Password must include at least one number' 
    }
  }
  
  if (!passwordChecks.hasSpecial) {
    return { 
      valid: false, 
      message: 'Password must include at least one special character (!@#$%^&*()_+etc.)' 
    }
  }
  
  return { valid: true, message: '' }
}

// Add email check function
const checkEmailAvailability = async () => {
  // Only check if there's an email to check
  if (!email.value || email.value.trim() === '') return
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address.'
    return
  }
  
  // Clear previous error
  emailError.value = null
  errorMsg.value = null
  emailChecked.value = false
  checkingEmail.value = true
  
  try {
    // Check if email exists
    const { data, error } = await useFetch('/api/auth/check-email', {
      method: 'POST',
      body: { email: email.value }
    })
    
    if (error.value) {
      if (error.value.statusCode === 409) {
        emailError.value = 'This email is already registered. Please try signing in instead.'
      } else {
        // Other error, just log it
        console.error('Email check error:', error.value)
      }
    } else {
      // Email is available
      emailChecked.value = true
    }
  } catch (err) {
    console.error('Email check error:', err)
  } finally {
    checkingEmail.value = false
  }
}

// Handle registration submission
const handleRegister = async () => {
  loading.value = true
  errorMsg.value = null
  successMsg.value = null

  // Check for email errors
  if (emailError.value) {
    errorMsg.value = emailError.value
    loading.value = false
    return
  }

  // Validate password
  const passwordValidation = validatePassword(password.value)
  if (!passwordValidation.valid) {
    errorMsg.value = passwordValidation.message
    loading.value = false
    return
  }

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
      // Registration successful - now automatically sign in the user
      successMsg.value = 'Account created successfully! Signing you in...'
      
      try {
        // Automatically sign in the user with their credentials
        const signInResult = await signIn('credentials', {
          email: email.value,
          password: password.value,
          redirect: false
        }) as Response

        if (signInResult.ok) {
          // Sign in successful - the watch() will handle navigation
          successMsg.value = 'Account created and signed in successfully!'
          // Reset form
          name.value = ''
          email.value = ''
          password.value = ''
        } else {
          // Sign in failed - redirect to login manually
          successMsg.value = 'Account created successfully! Please sign in.'
          setTimeout(() => {
            navigateTo('/login')
          }, 2000)
        }
      } catch (signInError) {
        console.error('Auto sign-in error:', signInError)
        // Fallback to manual login
        successMsg.value = 'Account created successfully! Please sign in.'
        setTimeout(() => {
          navigateTo('/login')
        }, 2000)
      }
    }
  } catch (err) {
    // Unexpected error
    console.error('Registration Error:', err)
    errorMsg.value = 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}

// Handle Google Sign-Up (which is the same as Sign-In for Google)
const handleGoogleSignUp = async () => {
  googleLoading.value = true;
  errorMsg.value = null; // Clear previous errors
  successMsg.value = null; // Clear previous success messages
  try {
    await signIn('google');
    // If redirect occurs, this part might not be reached.
    // Nuxt-auth and page guards handle post-login flow.
  } catch (err: any) {
    console.error('Google Sign-Up Invocation Error:', err);
    const message = err.message || 'An error occurred while trying to sign up with Google.';
    errorMsg.value = message;
  } finally {
    googleLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 100px);
  padding: 2rem;
  z-index: 2;
}

.register-card {
  position: relative;
  z-index: 0;
  overflow: hidden;
  background-color: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.3);
  width: 440px;
  padding: 2rem;

  &::before {
    content: '';
    position: absolute;
    inset: -50%;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    z-index: -1;
  }

  :deep(.p-card-title) {
    padding: 0;
  }
  :deep(.p-card-content) {
    padding-top: 0;
  }
}

.title {
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 1rem;
  color: #d7e2f1;
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.input,
:deep(.p-inputtext),
:deep(.p-password-input),
:deep(.p-password input) {
  width: 100%;
  border-radius: 6px;
  background: rgba(255,255,255,0.15);
  color: #e9f1fb;
  border: 1px solid rgba(255,255,255,0.25);
  padding: 0.75rem 1rem;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 2px 0 rgba(16, 30, 54, 0.03);
}

.input:focus,
:deep(.p-inputtext:focus),
:deep(.p-password-input:focus),
:deep(.p-password input:focus) {
  outline: none;
  border-color: #3caaff;
  background: rgba(255,255,255,0.22);
}

.field-help {
  margin-top: 0.5rem;
  color: #b6bdcb;
  font-size: 0.875rem;
}
.field-help.error {
  color: #ef4444;
}

.password-requirements {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: rgba(40, 54, 75, 0.25);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: #b6bdcb;
}
.password-requirements .requirement {
  display: flex;
  align-items: center;
  margin-bottom: 0.375rem;
  color: #b6bdcb;
}
.password-requirements .requirement:last-child {
  margin-bottom: 0;
}
.password-requirements .requirement.met {
  color: #38e38a;
}
.password-requirements .requirement i {
  margin-right: 0.5rem;
  font-size: 1rem;
}
.password-requirements .requirement:not(.met) i {
  color: #ef4444;
}

.submit-button,
.btn-primary {
  margin-top: 0.5rem;
  height: 2.75rem;
  font-weight: 500;
  background: linear-gradient(90deg, #3caaff 0%, #46c3e5 100%);
  border: none;
  color: #fff;
  box-shadow: 0 2px 10px 0 rgba(60,170,255,0.08);
  border-radius: 6px;
  transition: background 0.2s;
}
.submit-button:hover,
.btn-primary:hover {
  background: linear-gradient(90deg, #46c3e5 0%, #3caaff 100%);
}

.btn-secondary {
  background: rgba(255,255,255,0.08);
  color: #3caaff;
  border: 1px solid #3caaff;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
}
.btn-secondary:hover {
  background: #3caaff;
  color: #fff;
}

.email-input-container {
  position: relative;
  width: 100%;
}
.email-input-container :deep(.p-inputtext) {
  width: 100%;
}
.email-status-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
}
.email-status-icon.checking {
  color: #b6bdcb;
  animation: spin 1s linear infinite;
}
.email-status-icon.available {
  color: #38e38a;
}
.email-status-icon.taken {
  color: #ef4444;
}
@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.social-login-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 0rem 0;
  color: #b6bdcb;
}
.social-login-divider .divider-line {
  flex-grow: 1;
  height: 1px;
  background-color: #29374a;
}
.social-login-divider .divider-text {
  padding: 0 1rem;
  font-size: 0.875rem;
  color: #b6bdcb;
}

.google-button {
  // Optional: Add specific styling for Google button if p-button-secondary isn't enough
}

.footer-text {
  color: #929dac;
  margin-top: 1.5rem;
  font-size: 1rem;
  text-align: center;
}

.sign-in-link {
  color: #3caaff;
  font-weight: 500;
  transition: color 0.2s;
  margin-left: 0.25rem;
}
.sign-in-link:hover {
  color: #46c3e5;
  text-decoration: underline;
}
</style>