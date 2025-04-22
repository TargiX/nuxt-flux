// Import auth handler without TypeScript
import { NuxtAuthHandler } from '#auth'
import bcrypt from 'bcrypt'
import prisma from '~/server/utils/db'

export default NuxtAuthHandler({
  secret: useRuntimeConfig().auth.secret,

  pages: {
    signIn: '/login',
  },

  providers: [
    // Google provider defined inline
    {
      id: 'google',
      name: 'Google',
      type: 'oauth',
      authorization: { params: { scope: 'openid email profile' } },
      idToken: true,
      wellKnown: 'https://accounts.google.com/.well-known/openid-configuration',
      clientId: useRuntimeConfig().google.clientId,
      clientSecret: useRuntimeConfig().google.clientSecret,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
    
    // Credentials provider for email/password login
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
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
}) 