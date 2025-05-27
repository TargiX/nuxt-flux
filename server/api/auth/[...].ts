// Import from virtual module and types
import { NuxtAuthHandler } from '#auth'
import type { AuthConfig, User } from "@auth/core/types"
// Import official providers
import GoogleProvider from '@auth/core/providers/google'
import CredentialsProvider from '@auth/core/providers/credentials'

import bcrypt from 'bcrypt'
import prisma from '~/server/utils/db'

const runtimeConfig = useRuntimeConfig()

// Define AuthConfig according to documentation
export const authOptions: AuthConfig = {
  secret: runtimeConfig.authJs.secret,
  useSecureCookies: process.env.NODE_ENV === 'production', // Enable secure cookies in production
  trustHost: true, // Trust the host for production deployment
  session: { 
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name,
                image: (profile as any).picture,
                emailVerified: profile.email_verified ? new Date() : null,
              },
            });
          }
          return true; // Allow sign-in
        } catch (error) {
          return false; // Prevent sign-in on error
        }
      } else if (account?.provider === 'credentials') {
        if (user && user.id) { // For credentials, user object should be populated by 'authorize'
            user.id = String(user.id); 
        } else {
            return false; // Should not happen if authorize is correct
        }
        return true; // Allow sign-in
      }
      return false; // Deny sign-in for other cases
    },
    async jwt({ token, user, account, profile, trigger }) {
      if (trigger === 'signIn' || trigger === 'signUp') {
        if (account?.provider === 'google' && profile?.email) {
          try {
            const dbUser = await prisma.user.findUnique({ where: { email: profile.email } });
            if (dbUser) {
              token.id = dbUser.id.toString(); // Internal CUID
              token.name = dbUser.name;
              token.email = dbUser.email;
              token.picture = dbUser.image;
              if (account.access_token) {
                token.accessToken = account.access_token;
              }
            } else {
              return {}; // Critical error, return empty token
            }
          } catch (dbError) {
            return {}; // Critical error, return empty token
          }
        } else if (user?.id) { 
          token.id = String(user.id);
          token.name = user.name;
          token.email = user.email;
          token.picture = (user as any).image;
          if (account?.access_token) { 
            token.accessToken = account.access_token;
          }
        } else {
          return {};
        }
      } else if (trigger === "update" && token.id) {
      }
      
      return token;
    },
    async session({ session, token, user }) { // `user` param here is for database session strategy, usually not populated with JWT strategy this way.
      if (token?.id && session.user) {
        (session.user as { id?: string }).id = String(token.id); // Ensure string
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;

      } else {
        if (!token?.id) {
          return { user: {}, expires: session.expires };
        }
      }

      if (token?.accessToken) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
      }
      
      return session;
    },
  },
  
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
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.passwordHash) {
          return null
        }

        if (typeof user.passwordHash !== 'string') {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) {
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