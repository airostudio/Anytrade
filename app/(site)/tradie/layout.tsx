import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import DashboardNav, { type NavItem } from '@/components/DashboardNav'
import { Panel } from '@/components/ui'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { bidsForTradie } from '@/lib/repos/bids'
import { pendingReviewsFor } from '@/lib/repos/reviews'

export const dynamic = 'force-dynamic'

export default async function TradieLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/signin?callbackUrl=/tradie')
  if (session.user.role !== 'TRADESPERSON') redirect('/')

  const tradie = await getTradieByUserId(session.user.id)

  if (!tradie) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16">
        <Panel className="p-7">
          <h1 className="font-display text-2xl">Your tradie profile is missing</h1>
          <p className="mt-3 text-ink-soft">
            Your account exists but has no listing attached. Get in touch and we&apos;ll sort it out.
          </p>
          <Link href="/contact" className="btn-primary mt-5">
            Contact support
          </Link>
        </Panel>
      </div>
    )
  }

  const [bids, pending] = await Promise.all([
    bidsForTradie(tradie.id, 200),
    pendingReviewsFor(session.user.id, 'TRADESPERSON'),
  ])

  const liveBids = bids.filter((b) => ['PENDING', 'SHORTLISTED'].includes(b.status))
  const wonJobs = bids.filter((b) => b.status === 'ACCEPTED' && b.job_status !== 'COMPLETED')

  const items: NavItem[] = [
    { href: '/tradie', label: 'Overview', icon: '🧰' },
    { href: '/tradie/leads', label: 'Job leads', icon: '📡' },
    { href: '/tradie/bids', label: 'My quotes', icon: '📝', badge: liveBids.length },
    { href: '/tradie/jobs', label: 'Won jobs', icon: '✅', badge: wonJobs.length },
    { href: '/tradie/reviews', label: 'Ratings', icon: '⭐', badge: pending.length },
    { href: '/tradie/profile', label: 'My listing', icon: '📇' },
    { href: '/tradie/billing', label: 'Billing', icon: '💳' },
  ]

  return (
    <>
      <DashboardNav
        items={items}
        title={tradie.business_name}
        subtitle={`${tradie.lead_credits} lead credit${tradie.lead_credits === 1 ? '' : 's'} · ${
          tradie.verification_status === 'VERIFIED' ? 'Licence verified' : 'Verification pending'
        }`}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </>
  )
}
