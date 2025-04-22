<template>
  <div class="app-container">
    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Logo at the top -->
      <div class="logo-container">
        <img src="/assets/dreamseed-logo-white.png" alt="DreamSeed" class="logo">
      </div>
      
      <!-- Navigation items -->
      <nav class="nav-menu">
        <a href="#" class="nav-item active">
          <i class="pi pi-home"></i>
          <span>Home</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-plus"></i>
          <span>Create</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-images"></i>
          <span>Library</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-compass"></i>
          <span>Explore</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-search"></i>
          <span>Search</span>
        </a>
        <a href="#" class="nav-item">
          <i class="pi pi-bell"></i>
          <span>Notifications</span>
        </a>
      </nav>
      
      <!-- User section at bottom -->
      <div class="user-section">
        <div v-if="status === 'authenticated' && data?.user" class="user-profile">
          <div class="user-avatar">
             <img v-if="data.user.image" :src="data.user.image" alt="User Avatar" class="avatar-image" />
             <i v-else class="pi pi-user"></i>
          </div>
          <span class="user-name">{{ data.user.name || 'User' }}</span>
          <Button 
            icon="pi pi-sign-out" 
            @click="signOut()" 
            text 
            rounded 
            aria-label="Sign Out"
            class="p-button-secondary p-button-sm sign-out-button" 
           />
        </div>
        <div v-else class="login-options">
          <!-- Email/Password Login Button -->
          <Button 
            label="Sign in with Email" 
            icon="pi pi-envelope" 
            @click="navigateTo('/login')" 
            class="w-full mb-2" 
          />
          
          <!-- Google Login Button -->
          <Button 
            label="Sign in with Google" 
            icon="pi pi-google" 
            @click="signIn('google')" 
            class="w-full p-button-secondary" 
          />
        </div>
      </div>
    </div>
    
    <!-- Main content -->
    <div class="main-content">
      <NuxtPage />
    </div>
  </div>
</template>

<script setup lang="ts">
import Button from 'primevue/button';
const { status, data, signIn, signOut } = useAuth()
</script>

<style lang="scss">
.app-container {
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.sidebar {
  width: 220px;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
  position: relative;
  z-index: 10;
}

.logo-container {
  padding: 10px 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 15px;
  
  .logo {
    height: 55px;
    width: auto;
  }
}

.nav-menu {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: all 0.2s ease;
    
    i {
      margin-right: 12px;
      font-size: 1.2rem;
    }
    
    &:hover, &.active {
      color: #fff;
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    &.active {
      border-left: 3px solid #8EC5FC;
      padding-left: 17px;
    }
  }
}

.user-section {
  margin-top: auto;
  padding: 15px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  
  .user-profile {
    display: flex;
    align-items: center;
    position: relative;
    
    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8EC5FC, #E0C3FC);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      overflow: hidden;
      
      .avatar-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      i {
        color: #fff;
        font-size: 0.9rem;
      }
    }
    
    .user-name {
      color: #fff;
      font-size: 0.9rem;
    }

    .sign-out-button {
      margin-left: auto;
    }
  }

  .login-options {
    // Add appropriate styles for login options
  }
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-x: hidden;
  min-width: 0;
}
</style>
