import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Protected client routes
  if (pathname.startsWith('/client/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/client/signin', req.url))
    }
    if (userRole !== 'CLIENT') {
      return NextResponse.redirect(new URL('/tradesperson/dashboard', req.url))
    }
  }

  // Protected tradesperson routes
  if (pathname.startsWith('/tradesperson/dashboard')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/tradesperson/signin', req.url))
    }
    if (userRole !== 'TRADESPERSON') {
      return NextResponse.redirect(new URL('/client/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/client/dashboard/:path*', '/tradesperson/dashboard/:path*'],
}
