// file: auth.d.ts
import type { DefaultSession, User as DefaultUser } from '@auth/core/types';
import type { JWT as DefaultJWT } from '@auth/core/jwt';

declare module '@auth/core/types' {
  /**
   * Returned by `useSession`, `getServerSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user?: {
      id?: string; // Add the id property
    } & DefaultSession['user']; // Extend the default user properties
    accessToken?: string; // If you added accessToken to session
  }

  /**
   * The shape of the user object returned in the OAuth providers' `profile` callback,
   * or the second parameter of the `session` callback, when using a database.
   */
  interface User extends DefaultUser {
    id: string; // Ensure id is part of the User type used by Auth.js
    // Add any other custom properties you expect on the User object
    // e.g., role?: string;
  }
}

declare module '@auth/core/jwt' {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT extends DefaultJWT {
    /** OpenID ID Token */
    idToken?: string; // Example, if you were to add idToken
    id?: string; // User ID
    accessToken?: string; // Access Token from provider
    // e.g., role?: string;
  }
}

// If using Next.js App Router, you might also need to augment `next-auth` if you were using it directly
// declare module 'next-auth' { ... }
// declare module 'next-auth/jwt' { ... }

// Ensure this file is treated as a module.
export {}; 