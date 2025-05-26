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
console.log("[Auth Handler] NUXT_NEXTAUTH_URL:", runtimeConfig.authJs?.url);
console.log("[Auth Handler] trustHost setting should be true");
if (!runtimeConfig.authJs?.secret) {
  console.error("[Auth Handler] FATAL: runtimeConfig.authJs.secret is MISSING!");
}
// --- End Debugging ---

// Define AuthConfig according to documentation
export const authOptions: AuthConfig = {
  secret: runtimeConfig.authJs.secret, // Use the new config path
  trustHost: true, // Temporarily disable CSRF for testing
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[Auth SignIn CB] Entry. Provider:', account?.provider, 'User from provider:', JSON.stringify(user), 'Profile email:', profile?.email, 'Account:', JSON.stringify(account));

      if (account?.provider === 'google' && profile?.email) {
        console.log('[Auth SignIn CB] Google provider path. Email:', profile.email);
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: profile.email },
          });

          if (!dbUser) {
            console.log('[Auth SignIn CB] Google: User not found, creating new user.');
            dbUser = await prisma.user.create({
              data: {
                email: profile.email,
                name: profile.name,
                image: (profile as any).picture,
                emailVerified: profile.email_verified ? new Date() : null,
              },
            });
            console.log('[Auth SignIn CB] Google: New user created:', JSON.stringify(dbUser));
          } else {
            console.log('[Auth SignIn CB] Google: Existing user found:', JSON.stringify(dbUser));
          }
          console.log('[Auth SignIn CB] Google: User presence in DB confirmed/created. ID:', dbUser.id, ' User object from provider was:', JSON.stringify(user));
          return true; // Allow sign-in
        } catch (error) {
          console.error('[Auth SignIn CB] Google: Error during user processing:', error);
          return false; // Prevent sign-in on error
        }
      } else if (account?.provider === 'credentials') {
        console.log('[Auth SignIn CB] Credentials provider path. User object:', JSON.stringify(user));
        if (user && user.id) { // For credentials, user object should be populated by 'authorize'
            user.id = String(user.id); 
            console.log('[Auth SignIn CB] Credentials: Ensured user.id is string:', user.id);
        } else {
            console.warn('[Auth SignIn CB] Credentials: User object or user.id missing after authorize.');
            return false; // Should not happen if authorize is correct
        }
        return true; // Allow sign-in
      }
      console.warn('[Auth SignIn CB] Unhandled provider or conditions not met. Provider:', account?.provider, 'Profile Email:', profile?.email, 'Returning false -> AccessDenied.');
      return false; // Deny sign-in for other cases
    },
    async jwt({ token, user, account, profile, trigger }) {
      console.log('[Auth JWT CB] Entry. Trigger:', trigger);
      console.log('[Auth JWT CB] Initial token:', JSON.stringify(token));
      console.log('[Auth JWT CB] User object from signIn/authorize:', JSON.stringify(user));
      console.log('[Auth JWT CB] Account object:', JSON.stringify(account));
      console.log('[Auth JWT CB] Profile object (OAuth):', JSON.stringify(profile));

      
      if (trigger === 'signIn' || trigger === 'signUp') {
        // Priority for Google OAuth: always fetch from DB to ensure internal ID is used.
        if (account?.provider === 'google' && profile?.email) {
          console.log('[Auth JWT CB] Google signIn/signUp. Fetching user from DB using profile.email:', profile.email);
          try {
            const dbUser = await prisma.user.findUnique({ where: { email: profile.email } });
            if (dbUser) {
              console.log('[Auth JWT CB] Google: Found user in DB:', JSON.stringify(dbUser));
              token.id = dbUser.id.toString(); // Internal CUID
              token.name = dbUser.name;
              token.email = dbUser.email;
              token.picture = dbUser.image;
              if (account.access_token) {
                token.accessToken = account.access_token;
              }
            } else {
              console.error('[Auth JWT CB] Google: User NOT found in DB despite signIn success. Profile:', JSON.stringify(profile));
              return {}; // Critical error, return empty token
            }
          } catch (dbError) {
            console.error('[Auth JWT CB] Google: DB error fetching user:', dbError);
            return {}; // Critical error, return empty token
          }
        } else if (user?.id) { 
          // Case for other providers (e.g., credentials) where user object is already populated with correct ID
          console.log('[Auth JWT CB] Non-Google signIn/signUp. Populating token from provided user object. User ID:', user.id);
          token.id = String(user.id);
          token.name = user.name;
          token.email = user.email;
          token.picture = (user as any).image;
          // account.access_token might not be relevant for all non-Google providers like credentials
          if (account?.access_token) { 
            token.accessToken = account.access_token;
          }
        } else {
          console.warn('[Auth JWT CB] signIn/signUp trigger, but conditions not met for token population. Token might be incomplete. User:', JSON.stringify(user), 'Account:', JSON.stringify(account));
        }
      } else if (trigger === "update" && token.id) {
        console.log('[Auth JWT CB] Update trigger with existing token ID:', token.id);
        // Handle token updates if necessary
      }
      
      console.log('[Auth JWT CB] Returning token:', JSON.stringify(token));
      return token;
    },
    async session({ session, token, user }) { // `user` param here is for database session strategy, usually not populated with JWT strategy this way.
      console.log('[Auth Session CB] Entry.');
      console.log('[Auth Session CB] Initial session:', JSON.stringify(session));
      console.log('[Auth Session CB] Token received:', JSON.stringify(token));
      // console.log('[Auth Session CB] User object received (if applicable):', JSON.stringify(user));

      if (token?.id && session.user) {
        (session.user as { id?: string }).id = String(token.id); // Ensure string
        console.log('[Auth Session CB] Session user ID set from token.id:', (session.user as any).id);
        // Assign other details from token to session.user
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
        if (token.picture) session.user.image = token.picture as string;

      } else {
        console.warn('[Auth Session CB] Token ID not found or session.user missing. Token:', JSON.stringify(token), 'Session:', JSON.stringify(session));
      }

      if (token?.accessToken) {
        (session as { accessToken?: string }).accessToken = token.accessToken as string;
        console.log('[Auth Session CB] Session access token set from token.accessToken.');
      }
      
      console.log('[Auth Session CB] Returning session:', JSON.stringify(session));
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