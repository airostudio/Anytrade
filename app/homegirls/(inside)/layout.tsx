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
      <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-oxide text-canvas">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" tone="light" href="/" />
            <span className="border-2 border-canvas bg-ink px-2 py-0.5 font-sign text-[11px] font-bold uppercase tracking-[0.2em]">
              Homegirls
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link href="/homegirls" className="underline-offset-4 hover:underline">
              Network
            </Link>
            <Link href="/homegirls/join" className="underline-offset-4 hover:underline">
              Join / post
            </Link>
            <Link href="/" className="underline-offset-4 hover:underline">
              Main site
            </Link>
            <form action={lockHomegirlsGate}>
              <button
                type="submit"
                className="border-2 border-canvas/60 px-2.5 py-1 font-sign text-[11px] font-bold uppercase tracking-widest hover:bg-canvas hover:text-ink"
              >
                Lock
              </button>
            </form>
          </nav>
        </div>
        <div className="hazard-tape" aria-hidden />
      </header>

      <main className="flex-1 bg-canvas">{children}</main>

      <footer className="border-t-[3px] border-ink bg-ink px-4 py-6 text-center text-xs text-canvas/70">
        The Homegirls network · private to members · be decent to each other
      </footer>
    </div>
  )
}
