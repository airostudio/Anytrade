import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './lib/auth.config'

// Edge-safe auth instance — no database provider attached.
const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { pathname, search } = req.nextUrl
  const role = req.auth?.user?.role
  const isLoggedIn = Boolean(req.auth)

  const signInWithReturn = () => {
    const url = new URL('/signin', req.url)
    url.searchParams.set('callbackUrl', `${pathname}${search}`)
    return NextResponse.redirect(url)
  }

  // Admin: must be signed in AND hold the ADMIN role. The separate admin
  // passcode gate is enforced in app/admin/layout.tsx, which can read the
  // database and the signed gate cookie.
  if (pathname.startsWith('/admin')) {
    if (!isLoggedIn) return signInWithReturn()
    if (role !== 'ADMIN') return NextResponse.redirect(new URL('/', req.url))
  }

  if (pathname.startsWith('/dashboard')) {
    if (!isLoggedIn) return signInWithReturn()
    if (role === 'TRADESPERSON') return NextResponse.redirect(new URL('/tradie', req.url))
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url))
  }

  if (pathname.startsWith('/tradie')) {
    if (!isLoggedIn) return signInWithReturn()
    if (role === 'CLIENT') return NextResponse.redirect(new URL('/dashboard', req.url))
    if (role === 'ADMIN') return NextResponse.redirect(new URL('/admin', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/tradie/:path*'],
}
