import Link from 'next/link'
import { auth } from '@/lib/auth'
import { homeForRole } from '@/lib/auth'
import Logo from './Logo'
import MobileNav from './MobileNav'

const LINKS = [
  { href: '/handyman', label: 'Handyman' },
  { href: '/find-a-tradie', label: 'Find a Tradie' },
  { href: '/trades', label: 'Trades' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/pricing', label: 'For Tradies' },
]

export default async function SiteHeader() {
  const session = await auth()
  const user = session?.user

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Logo size="sm" />

        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-2 border-transparent px-3 py-2 font-sign text-sm font-bold uppercase tracking-wider text-ink transition-colors hover:border-ink hover:bg-mustard"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link href={homeForRole(user.role)} className="btn-ghost btn-sm hidden sm:inline-flex">
                {user.role === 'ADMIN' ? 'Admin' : 'My Account'}
              </Link>
              <Link href="/post-a-job" className="btn-primary btn-sm">
                Post a Job
              </Link>
            </>
          ) : (
            <>
              <Link href="/signin" className="btn-ghost btn-sm hidden sm:inline-flex">
                Sign In
              </Link>
              <Link href="/post-a-job" className="btn-primary btn-sm">
                Post a Job
              </Link>
            </>
          )}
          <MobileNav links={LINKS} signedIn={Boolean(user)} accountHref={homeForRole(user?.role)} />
        </div>
      </div>
      <div className="hazard-tape" aria-hidden />
    </header>
  )
}
