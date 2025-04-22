<template>
  <div class="auth-layout">
    <div class="auth-header">
      <img src="/assets/dreamseed-logo-white.png" alt="DreamSeed" class="logo">
    </div>
    
    <div class="auth-content">
      <slot />
    </div>
    
    <div class="auth-footer">
      <p>&copy; {{ new Date().getFullYear() }} DreamSeed. All rights reserved.</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a, #1e293b);
}

.auth-header {
  padding: 20px;
  text-align: center;
  
  .logo {
    height: 60px;
    width: auto;
  }
}

.auth-content {
  flex: 1;
  padding: 20px;
}

.auth-footer {
  padding: 20px;
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
}
</style> 