import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { isGateUnlocked } from '@/lib/gates'
import { lockAdminGate } from '@/app/actions/gates'
import Logo from '@/components/Logo'
import { NavIcon } from '@/components/icons'
import { platformStats } from '@/lib/repos/admin'

export const metadata: Metadata = { robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const LINKS = [
  { href: '/admin', label: 'Dashboard', icon: 'dashboard' },
  { href: '/admin/users', label: 'Users', icon: 'users' },
  { href: '/admin/tradies', label: 'Tradies', icon: 'tradies', badgeKey: 'verification' },
  { href: '/admin/jobs', label: 'Jobs', icon: 'jobs' },
  { href: '/admin/bids', label: 'Quotes', icon: 'quotes' },
  { href: '/admin/payments', label: 'Payments', icon: 'payments' },
  { href: '/admin/reviews', label: 'Reviews', icon: 'reviews', badgeKey: 'reviews' },
  { href: '/admin/homegirls', label: 'Homegirls', icon: 'homegirls' },
  { href: '/admin/enquiries', label: 'Enquiries', icon: 'enquiries', badgeKey: 'enquiries' },
  { href: '/admin/analytics', label: 'Analytics', icon: 'analytics' },
  { href: '/admin/audit', label: 'Audit log', icon: 'audit' },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
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
      <header className="sticky top-0 z-50 bg-navy-deep text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size="sm" tone="light" href="/admin" />
            <span className="rounded-full bg-safety px-3 py-1 text-xs font-bold text-ink">Back office</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-white/75 sm:inline">{session.user.name}</span>
            <Link href="/" className="font-medium text-white/85 underline-offset-4 hover:underline">
              View site
            </Link>
            <form action={lockAdminGate}>
              <button
                type="submit"
                className="rounded-lg border border-white/30 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/10"
              >
                Lock
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="lg:flex">
        <aside className="border-b border-hairline bg-white lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
          <nav aria-label="Admin" className="flex gap-1 overflow-x-auto p-3 lg:flex-col lg:gap-1 lg:p-4">
            {LINKS.map((link) => {
              const badge = 'badgeKey' in link ? badges[link.badgeKey as string] : 0
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-[15px] font-semibold text-ink transition-colors hover:bg-canvas-deep"
                >
                  <NavIcon name={link.icon} />
                  <span className="whitespace-nowrap">{link.label}</span>
                  {badge ? (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-oxide px-1.5 text-xs font-bold text-white">
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
