import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { isGateUnlocked } from '@/lib/gates'
import { lockAdminGate } from '@/app/actions/gates'
import Logo from '@/components/Logo'
import { platformStats } from '@/lib/repos/admin'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/tradies', label: 'Tradies', icon: '🧰', badgeKey: 'verification' },
  { href: '/admin/jobs', label: 'Jobs', icon: '📋' },
  { href: '/admin/bids', label: 'Quotes', icon: '📝' },
  { href: '/admin/payments', label: 'Payments', icon: '💰' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐', badgeKey: 'reviews' },
  { href: '/admin/homegirls', label: 'Homegirls', icon: '👷‍♀️' },
  { href: '/admin/enquiries', label: 'Enquiries', icon: '✉️', badgeKey: 'enquiries' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/audit', label: 'Audit log', icon: '🗒️' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
] as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') redirect('/')
  if (!(await isGateUnlocked('admin'))) redirect('/admin/unlock')

  const stats = await platformStats()
  const badges: Record<string, number> = {
    verification: stats.tradies.pendingVerification,
    reviews: stats.reviews.flagged + stats.reviews.pending,
    enquiries: stats.enquiries.unhandled,
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-50 border-b-[3px] border-ink bg-ink text-canvas">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" tone="light" href="/admin" />
            <span className="border-2 border-canvas bg-oxide px-2 py-0.5 font-sign text-[11px] font-bold uppercase tracking-[0.2em]">
              Back office
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-canvas/70 sm:inline">{session.user.name}</span>
            <Link href="/" className="text-canvas/80 underline-offset-4 hover:underline">
              View site
            </Link>
            <form action={lockAdminGate}>
              <button
                type="submit"
                className="border-2 border-canvas/50 px-2.5 py-1 font-sign text-[11px] font-bold uppercase tracking-widest hover:bg-canvas hover:text-ink"
              >
                Lock
              </button>
            </form>
          </div>
        </div>
        <div className="hazard-tape" aria-hidden />
      </header>

      <div className="lg:flex">
        <aside className="border-b-[3px] border-ink bg-canvas-deep lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r-[3px]">
          <nav className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-1.5 lg:p-4">
            {LINKS.map((link) => {
              const badge = 'badgeKey' in link ? badges[link.badgeKey as string] : 0
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex shrink-0 items-center gap-2.5 border-2 border-ink bg-canvas px-3 py-2 font-sign text-sm font-bold uppercase tracking-wide transition-colors hover:bg-safety"
                >
                  <span aria-hidden>{link.icon}</span>
                  <span className="whitespace-nowrap">{link.label}</span>
                  {badge ? (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center border-2 border-ink bg-oxide px-1 text-[11px] text-canvas">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
