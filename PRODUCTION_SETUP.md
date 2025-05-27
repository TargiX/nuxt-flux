# Production Setup Guide

## 🚨 Critical Issues to Fix

Based on your server logs, here are the issues causing authentication failures:

### 1. JWT Decryption Failures
**Problem**: `JWEDecryptionFailed: decryption operation failed`
**Cause**: JWT tokens encrypted with one secret are being decrypted with a different secret

### 2. Missing Environment Variables
**Problem**: `runtimeConfig.google.clientId is MISSING!`
**Cause**: Environment variables not properly loaded

### 3. Database Connection Issues
**Problem**: Prisma validation errors
**Cause**: Database connection or schema issues

## 🛠️ Step-by-Step Fix

### Step 1: Clear All Sessions and Cookies

**On your server, run:**
```bash
# Stop the application
pm2 stop dreamseed

# Clear any existing session data (if using file-based sessions)
rm -rf /tmp/sessions* 2>/dev/null || true

# Clear browser cookies for your domain
# Users will need to clear cookies or you can change the cookie name
```

### Step 2: Verify Environment Variables

**Check your production `.env` file:**
```bash
cd /var/www/dreamseed
cat .env
```

**Required variables:**
```env
# Authentication (CRITICAL - must be 32+ characters)
NEXTAUTH_SECRET=your-super-long-secret-key-here-minimum-32-characters

# Google OAuth (if using Google login)
NUXT_GOOGLE_CLIENT_ID=your-google-client-id
NUXT_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=your-database-connection-string

# Other APIs
GEMINI_API_KEY=your-gemini-key
FLUX_API_KEY=your-flux-key

# Production URL
NEXTAUTH_URL=http://5.161.248.184:3000
```

### Step 3: Generate New Auth Secret

**Generate a new secure secret:**
```bash
# Generate a new 64-character secret
openssl rand -hex 32
```

**Update your `.env` file:**
```bash
nano /var/www/dreamseed/.env
# Replace NEXTAUTH_SECRET with the new value
```

### Step 4: Verify Database Connection

**Test Prisma connection:**
```bash
cd /var/www/dreamseed
npx prisma db pull
npx prisma generate
```

### Step 5: Rebuild and Deploy

**Rebuild the application:**
```bash
cd /var/www/dreamseed

# Install dependencies
pnpm install

# Generate Prisma client
npx prisma generate

# Build for production
pnpm run build

# Restart with PM2
pm2 restart dreamseed

# Check logs
pm2 logs dreamseed --lines 20
```

### Step 6: Test Authentication

1. **Clear browser cookies** for your domain
2. **Visit your site** and try to register/login
3. **Check logs** for the new debug output:
   ```bash
   pm2 logs dreamseed --lines 50
   ```

## 🔍 Debug Information

The updated auth handler now logs:
- Environment variable validation
- Authentication flow steps
- Database operations
- Error details

Look for these log entries:
- `[Auth Handler] Environment Validation:`
- `[Auth SignIn CB]`
- `[Auth JWT CB]`
- `[Auth Session CB]`
- `[Auth Credentials]`

## 🚨 Common Issues & Solutions

### Issue: "NEXTAUTH_SECRET is missing"
**Solution**: Ensure the secret is in `.env` and is 32+ characters

### Issue: "Google client ID is missing"
**Solution**: 
```bash
# Check if variables are loaded
echo $NUXT_GOOGLE_CLIENT_ID
echo $NUXT_GOOGLE_CLIENT_SECRET
```

### Issue: JWT Decryption still failing
**Solution**: 
1. Change `NEXTAUTH_SECRET` to a new value
2. Clear all browser cookies
3. Restart the application

### Issue: Database connection errors
**Solution**:
```bash
# Test database connection
npx prisma db pull
# If this fails, check your DATABASE_URL
```

## 📋 Verification Checklist

- [ ] New `NEXTAUTH_SECRET` generated and set
- [ ] All environment variables present in `.env`
- [ ] Database connection working (`npx prisma db pull`)
- [ ] Application rebuilt (`pnpm run build`)
- [ ] PM2 restarted (`pm2 restart dreamseed`)
- [ ] Browser cookies cleared
- [ ] Logs show successful environment validation
- [ ] Authentication flow working

## 🔧 Emergency Fallback

If issues persist:

1. **Disable Google OAuth temporarily:**
   ```bash
   # Comment out Google env vars in .env
   # NUXT_GOOGLE_CLIENT_ID=...
   # NUXT_GOOGLE_CLIENT_SECRET=...
   ```

2. **Test with credentials only:**
   - Try registering with email/password
   - Check if the issue is Google-specific

3. **Reset everything:**
   ```bash
   # Stop app
   pm2 stop dreamseed
   
   # Clear sessions
   rm -rf /tmp/sessions* 2>/dev/null || true
   
   # Generate new secret
   export NEW_SECRET=$(openssl rand -hex 32)
   sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEW_SECRET/" .env
   
   # Rebuild and restart
   pnpm run build
   pm2 restart dreamseed
   ```

## 📞 Support

If you're still having issues after following this guide:

1. **Share the new debug logs** (they'll show exactly what's missing)
2. **Confirm environment variables** are loaded correctly
3. **Test locally** with the same environment variables

The enhanced logging will help identify the exact issue. 