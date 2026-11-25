import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { isGateUnlocked } from '@/lib/gates'
import { lockHomegirlsGate } from '@/app/actions/gates'
import Logo from '@/components/Logo'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function HomegirlsLayout({ children }: { children: React.ReactNode }) {
  if (!(await isGateUnlocked('homegirls'))) redirect('/homegirls/enter')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 bg-navy-deep text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" tone="light" href="/" />
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold tracking-wide">
              Homegirls members area
            </span>
          </div>
          <nav aria-label="Members area" className="flex items-center gap-3 text-sm">
            <Link href="/homegirls" className="font-medium underline-offset-4 hover:underline">
              Network
            </Link>
            <Link href="/homegirls/join" className="font-medium underline-offset-4 hover:underline">
              Join / post
            </Link>
            <Link href="/homegirls-network" className="font-medium underline-offset-4 hover:underline">
              Public page
            </Link>
            <Link href="/" className="font-medium underline-offset-4 hover:underline">
              Main site
            </Link>
            <form action={lockHomegirlsGate}>
              <button
                type="submit"
                className="rounded-lg border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/10"
              >
                Lock
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-canvas">{children}</main>

      <footer className="bg-navy-deep px-4 py-6 text-center text-sm text-white/75">
        The Homegirls network · private to members · be decent to each other
      </footer>
    </div>
  )
}
