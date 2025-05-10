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
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user && typeof user.id === 'string') { // Check user.id type explicitly
        token.id = user.id; // user.id from Prisma is string
        if (account.access_token) {
            token.accessToken = account.access_token;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Assign properties to session if they exist on the token
      if (typeof token.id === 'string' && session.user) {
        (session.user as { id?: string }).id = token.id;
      }
      if (typeof token.accessToken === 'string') {
        (session as { accessToken?: string }).accessToken = token.accessToken;
      }
      return session;
    },
  },
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
        if (!credentials?.email || typeof credentials.email !== 'string' || 
            !credentials?.password || typeof credentials.password !== 'string') {
          console.error('Credentials missing or not strings');
          return null;
        }

        // At this point, credentials.email and credentials.password are known to be strings
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