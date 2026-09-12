import type { NextAuthConfig } from 'next-auth'
import type { UserRole } from './types'

/**
 * Edge-safe slice of the auth config.
 *
 * Middleware runs on the edge runtime, which cannot open a Postgres socket, so
 * the credentials provider (and everything it imports) lives in lib/auth.ts and
 * only this cookie/JWT-shaped config is shared with middleware.
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  // Required outside Vercel (self-hosted, Docker, a reverse proxy): without it
  // Auth.js rejects every request with UntrustedHost. NEXTAUTH_URL still fixes
  // the canonical origin used in callback links.
  trustHost: true,
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role
        token.tradespersonId = user.tradespersonId
        token.tradieSlug = user.tradieSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.tradespersonId = token.tradespersonId as string | undefined
        session.user.tradieSlug = token.tradieSlug as string | undefined
      }
      return session
    },
  },
} satisfies NextAuthConfig
