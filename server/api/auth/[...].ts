// Import from virtual module and types
import { NuxtAuthHandler } from '#auth'
import type { AuthConfig, User } from '@auth/core/types'
// Import official providers
import GoogleProvider from '@auth/core/providers/google'
import CredentialsProvider from '@auth/core/providers/credentials'

import bcrypt from 'bcrypt'
import prisma from '~/server/utils/db'

const runtimeConfig = useRuntimeConfig()

// Comprehensive environment validation
console.log('[Auth Handler] Environment Validation:')
console.log('[Auth Handler] NODE_ENV:', process.env.NODE_ENV)
console.log('[Auth Handler] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
console.log('[Auth Handler] NEXTAUTH_SECRET length:', process.env.NEXTAUTH_SECRET?.length || 0)
console.log('[Auth Handler] NUXT_GOOGLE_CLIENT_ID exists:', !!process.env.NUXT_GOOGLE_CLIENT_ID)
console.log(
  '[Auth Handler] NUXT_GOOGLE_CLIENT_SECRET exists:',
  !!process.env.NUXT_GOOGLE_CLIENT_SECRET
)
console.log('[Auth Handler] Runtime config authJs.secret exists:', !!runtimeConfig.authJs?.secret)
console.log(
  '[Auth Handler] Runtime config google.clientId exists:',
  !!runtimeConfig.google?.clientId
)
console.log(
  '[Auth Handler] Runtime config google.clientSecret exists:',
  !!runtimeConfig.google?.clientSecret
)

// Validate critical environment variables
if (!runtimeConfig.authJs?.secret) {
  console.error('[Auth Handler] FATAL: NEXTAUTH_SECRET is missing or empty!')
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

if (!runtimeConfig.google?.clientId) {
  console.error('[Auth Handler] FATAL: NUXT_GOOGLE_CLIENT_ID is missing!')
  console.error(
    '[Auth Handler] Available env vars:',
    Object.keys(process.env).filter((key) => key.includes('GOOGLE'))
  )
}

if (!runtimeConfig.google?.clientSecret) {
  console.error('[Auth Handler] FATAL: NUXT_GOOGLE_CLIENT_SECRET is missing!')
}

// Define AuthConfig according to documentation
export const authOptions: AuthConfig = {
  secret: runtimeConfig.authJs.secret,
  useSecureCookies: process.env.NODE_ENV === 'production' && false,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[Auth SignIn CB] Provider:', account?.provider)
      console.log('[Auth SignIn CB] User ID:', user?.id)
      console.log('[Auth SignIn CB] Profile email:', profile?.email)

      if (account?.provider === 'google' && profile?.email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: profile.email },
          })

          if (!dbUser) {
            console.log('[Auth SignIn CB] Creating new Google user:', profile.email)
            dbUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name,
                image: (profile as any).picture,
                emailVerified: profile.email_verified ? new Date() : null,
              },
            })
          } else {
            console.log('[Auth SignIn CB] Found existing Google user:', dbUser.id)
          }
          return true
        } catch (error) {
          console.error('[Auth SignIn CB] Database error:', error)
          return false
        }
      } else if (account?.provider === 'credentials') {
        if (user && user.id) {
          console.log('[Auth SignIn CB] Credentials user authenticated:', user.id)
          user.id = String(user.id)
        } else {
          console.error('[Auth SignIn CB] Credentials user missing ID')
          return false
        }
        return true
      }
      console.error('[Auth SignIn CB] Unknown provider or missing data')
      return false
    },
    async jwt({ token, user, account, profile, trigger }) {
      console.log('[Auth JWT CB] Trigger:', trigger)
      console.log('[Auth JWT CB] Token ID exists:', !!token?.id)
      console.log('[Auth JWT CB] User ID:', user?.id)

      if (trigger === 'signIn' || trigger === 'signUp') {
        if (account?.provider === 'google' && profile?.email) {
          try {
            const dbUser = await prisma.user.findUnique({ where: { email: profile.email } })
            if (dbUser) {
              token.id = dbUser.id.toString()
              token.name = dbUser.name
              token.email = dbUser.email
              token.picture = dbUser.image
              if (account.access_token) {
                token.accessToken = account.access_token
              }
              console.log('[Auth JWT CB] Google token updated with user ID:', token.id)
            } else {
              console.error(
                '[Auth JWT CB] Google user not found in database, keeping existing token'
              )
              // Don't return empty object - keep existing token
            }
          } catch (dbError) {
            console.error('[Auth JWT CB] Database error:', dbError)
            // Don't return empty object - keep existing token in case of DB errors
          }
        } else if (user?.id) {
          token.id = String(user.id)
          token.name = user.name
          token.email = user.email
          token.picture = (user as any).image
          if (account?.access_token) {
            token.accessToken = account.access_token
          }
          console.log('[Auth JWT CB] Credentials token updated with user ID:', token.id)
        } else {
          console.error('[Auth JWT CB] No user data available, keeping existing token')
          // Don't return empty object - keep existing token
        }
      }

      return token
    },
    async session({ session, token, user }) {
      console.log('[Auth Session CB] Token ID:', token?.id)
      console.log('[Auth Session CB] Session user exists:', !!session.user)

      if (token?.id && session.user) {
        ;(session.user as { id?: string }).id = String(token.id)
        if (token.name) session.user.name = token.name as string
        if (token.email) session.user.email = token.email as string
        if (token.picture) session.user.image = token.picture as string
        console.log('[Auth Session CB] Session updated with user ID:', token.id)
      } else {
        if (!token?.id) {
          console.error('[Auth Session CB] No token ID available')
          // Return the session as-is instead of empty user
        }
      }

      if (token?.accessToken) {
        ;(session as { accessToken?: string }).accessToken = token.accessToken as string
      }

      return session
    },
  },

  providers: [
    // Only include Google provider if credentials are available
    ...(runtimeConfig.google?.clientId && runtimeConfig.google?.clientSecret
      ? [
          GoogleProvider({
            clientId: runtimeConfig.google.clientId,
            clientSecret: runtimeConfig.google.clientSecret,
            issuer: 'https://accounts.google.com',
          }),
        ]
      : []),

    // Credentials provider for email/password login
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('[Auth Credentials] Authorize attempt for:', credentials?.email)

        if (
          !credentials?.email ||
          typeof credentials.email !== 'string' ||
          !credentials?.password ||
          typeof credentials.password !== 'string'
        ) {
          console.error('[Auth Credentials] Invalid credentials format')
          return null
        }

        try {
          const user = await prisma.user.findUnique({ where: { email: credentials.email } })
          if (!user || !user.passwordHash) {
            console.error('[Auth Credentials] User not found or no password hash')
            return null
          }

          if (typeof user.passwordHash !== 'string') {
            console.error('[Auth Credentials] Invalid password hash type')
            return null
          }

          const valid = await bcrypt.compare(credentials.password, user.passwordHash)
          if (!valid) {
            console.error('[Auth Credentials] Password validation failed')
            return null
          }

          console.log('[Auth Credentials] User authenticated successfully:', user.id)
          return { id: user.id, name: user.name, email: user.email, image: user.image }
        } catch (error) {
          console.error('[Auth Credentials] Database error:', error)
          return null
        }
      },
    }),
  ],
}

// Log final provider count
console.log('[Auth Handler] Total providers configured:', authOptions.providers.length)

// Export the handler, passing options and runtime config
export default NuxtAuthHandler(authOptions, runtimeConfig)

/* Removing all old commented out code */
