<template>
  <div class="register-container">
    <Card class="register-card">
      <template #title>
        <h2 class="title">Create Account</h2>
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
import { ref, reactive } from 'vue'
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
const checkingEmail = ref(false)
const emailChecked = ref(false)
const emailError = ref<string | null>(null)

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

.password-requirements {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  
  .requirement {
    display: flex;
    align-items: center;
    margin-bottom: 0.375rem;
    color: #64748b;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.met {
      color: #16a34a;
    }
    
    i {
      margin-right: 0.5rem;
      font-size: 1rem;
    }
    
    &:not(.met) i {
      color: #ef4444;
    }
  }
}

.submit-button {
  margin-top: 0.5rem;
  height: 2.75rem;
  font-weight: 500;
}

.sign-in-link {
  color: #6366f1;
  font-weight: 500;
  transition: color 0.2s;
  
  &:hover {
    color: #4f46e5;
    text-decoration: underline;
  }
}

.email-input-container {
  position: relative;
  width: 100%;
  
  :deep(.p-inputtext) {
    width: 100%;
  }
}

.email-status-icon {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  
  &.checking {
    color: #6b7280;
    animation: spin 1s linear infinite;
  }
  
  &.available {
    color: #10b981; // green
  }
  
  &.taken {
    color: #ef4444; // red
  }
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.field-help {
  &.error {
    color: #ef4444;
  }
}
</style> 