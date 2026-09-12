import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { authConfig } from './auth.config'
import { query, queryOne } from './db'
import type { UserRole } from './types'

interface AuthRow {
  id: string
  email: string
  name: string
  role: UserRole
  password: string
  is_suspended: boolean
  tradesperson_id: string | null
  tradie_slug: string | null
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '')
          .trim()
          .toLowerCase()
        const password = String(credentials?.password ?? '')
        if (!email || !password) return null

        const row = await queryOne<AuthRow>(
          `SELECT u.id, u.email, u.name, u.role, u.password, u.is_suspended,
                  t.id   AS tradesperson_id,
                  t.slug AS tradie_slug
             FROM users u
             LEFT JOIN tradespeople t ON t.user_id = u.id
            WHERE u.email = $1`,
          [email]
        )

        if (!row || row.is_suspended) return null
        if (!(await bcrypt.compare(password, row.password))) return null

        await query('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id])

        return {
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          tradespersonId: row.tradesperson_id ?? undefined,
          tradieSlug: row.tradie_slug ?? undefined,
        }
      },
    }),
  ],
})

/** The signed-in session, or null. */
export async function currentUser() {
  const session = await auth()
  return session?.user ?? null
}

/** Landing page for a role, used after sign-in and by guards. */
export function homeForRole(role: UserRole | undefined): string {
  switch (role) {
    case 'ADMIN':
      return '/admin'
    case 'TRADESPERSON':
      return '/tradie'
    case 'CLIENT':
      return '/dashboard'
    default:
      return '/'
  }
}
