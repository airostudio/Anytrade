import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import DashboardNav, { type NavItem } from '@/components/DashboardNav'
import { jobsForClient } from '@/lib/repos/jobs'
import { pendingReviewsFor } from '@/lib/repos/reviews'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/signin?callbackUrl=/dashboard')
  if (session.user.role !== 'CLIENT') redirect('/')

  const [jobs, pending] = await Promise.all([
    jobsForClient(session.user.id, 100),
    pendingReviewsFor(session.user.id, 'CLIENT'),
  ])

  const live = jobs.filter((j) => ['OPEN', 'SHORTLISTING', 'AWARDED', 'IN_PROGRESS'].includes(j.status))

  const items: NavItem[] = [
    { href: '/dashboard', label: 'My jobs', icon: '📋', badge: live.length },
    { href: '/dashboard/payments', label: 'Payments', icon: '💳' },
    { href: '/dashboard/account', label: 'Account', icon: '⚙️' },
    { href: '/post-a-job', label: 'Post a job', icon: '➕' },
  ]

  return (
    <>
      <DashboardNav
        items={items}
        title={`G'day, ${session.user.name?.split(' ')[0] ?? 'there'}`}
        subtitle={
          pending.length
            ? `${pending.length} job${pending.length === 1 ? '' : 's'} waiting on your rating`
            : 'Everything that needs doing, in one place.'
        }
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</div>
    </>
  )
}
