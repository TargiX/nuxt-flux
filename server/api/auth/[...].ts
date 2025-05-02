// Import from virtual module and types
import { NuxtAuthHandler } from '#auth'
import type { AuthConfig, Profile, User } from "@auth/core/types"

import bcrypt from 'bcrypt'
import prisma from '~/server/utils/db'

const runtimeConfig = useRuntimeConfig()

// Define AuthConfig according to documentation
export const authOptions: AuthConfig = {
  secret: runtimeConfig.authJs.secret, // Use the new config path
  // pages: { // Keep pages commented out unless needed
  //   signIn: '/login',
  // },
  providers: [
    // Google provider definition (should be compatible)
    {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      authorization: { params: { scope: 'openid email profile' } },
      wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
      clientId: runtimeConfig.google.clientId,
      clientSecret: runtimeConfig.google.clientSecret,
      profile(profile: Record<string, any> & { sub: string, picture: string }) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
    
    // Credentials provider definition (should be compatible)
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: Partial<Record<string, unknown>> | undefined, req: Request): Promise<User | null> {
        if (!credentials?.email || !credentials?.password) {
          console.error('Credentials missing')
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          console.log('No user found or user has no password hash for email:', credentials.email)
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          console.log('Invalid password for email:', credentials.email)
          return null
        }

        console.log('Credentials valid for:', credentials.email)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      }
    }
  ],
}

// Export the handler, passing options and runtime config
export default NuxtAuthHandler(authOptions)

/* Removing all old commented out code */ 