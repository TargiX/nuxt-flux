// Import from virtual module and types
import { NuxtAuthHandler } from '#auth'
import type { AuthConfig, User } from "@auth/core/types"
// Import official providers
import GoogleProvider from '@auth/core/providers/google'
import CredentialsProvider from '@auth/core/providers/credentials'

import bcrypt from 'bcrypt'
import prisma from '~/server/utils/db'

const runtimeConfig = useRuntimeConfig()

// --- Debugging --- 
console.log("[Auth Handler] Reading runtimeConfig.authJs.secret:", runtimeConfig.authJs?.secret ? 'SECRET_FOUND' : 'SECRET_MISSING_OR_UNDEFINED');
if (!runtimeConfig.authJs?.secret) {
  console.error("[Auth Handler] FATAL: runtimeConfig.authJs.secret is MISSING!");
}
// --- End Debugging ---

// Define AuthConfig according to documentation
export const authOptions: AuthConfig = {
  secret: runtimeConfig.authJs.secret, // Use the new config path
  session: { strategy: 'jwt' },
  // pages: { // Keep pages commented out unless needed
  //   signIn: '/login',
  // },
  providers: [
    // Official Google OAuth provider (configured via well-known issuer)
    GoogleProvider({
      clientId: runtimeConfig.google.clientId,
      clientSecret: runtimeConfig.google.clientSecret,
      issuer: 'https://accounts.google.com' // Specify the OIDC issuer for Google
    }),
    
    // Credentials provider for email/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Credentials missing')
          return null
        }

        // Ensure password is a string
        if (typeof credentials.password !== 'string') {
          console.error('Password is not a string');
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.passwordHash) {
          console.log('No user or missing passwordHash for:', credentials.email)
          return null
        }

        // Ensure passwordHash is a string
        if (typeof user.passwordHash !== 'string') {
          console.error('User passwordHash is not a string for email:', credentials.email);
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) {
          console.log('Invalid password for:', credentials.email)
          return null
        }

        return { id: user.id, name: user.name, email: user.email, image: user.image }
      }
    })
  ],
}

// Export the handler, passing options and runtime config
export default NuxtAuthHandler(authOptions, runtimeConfig)

/* Removing all old commented out code */ 