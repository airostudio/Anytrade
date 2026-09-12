import Link from 'next/link'
import { auth } from '@/lib/auth'
import JobCard from '@/components/JobCard'
import Stars from '@/components/Stars'
import { EmptyState, Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { leadsForTradie } from '@/lib/repos/jobs'
import { bidsForTradie } from '@/lib/repos/bids'
import { pendingReviewsFor } from '@/lib/repos/reviews'
import { listNotifications } from '@/lib/repos/notifications'
import { MEMBERSHIP_LABEL, money, rating1dp, timeAgo, BID_STATUS_LABEL, bidStatusTone } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function TradieOverview({
  searchParams,
}: {
  searchParams: { rated?: string }
}) {
  const session = await auth()
  if (!session?.user) return null

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return null

  const [leads, bids, pending, notifications] = await Promise.all([
    leadsForTradie(tradie.id, { limit: 4 }),
    bidsForTradie(tradie.id, 100),
    pendingReviewsFor(session.user.id, 'TRADESPERSON'),
    listNotifications(session.user.id, 6),
  ])

  const liveBids = bids.filter((b) => ['PENDING', 'SHORTLISTED'].includes(b.status))
  const won = bids.filter((b) => b.status === 'ACCEPTED')
  const winRate = bids.length ? Math.round((won.length / bids.length) * 100) : 0
  const pipeline = won
    .filter((b) => b.job_status !== 'COMPLETED')
    .reduce((total, b) => total + b.amount, 0)

  return (
    <div className="space-y-10">
      {searchParams.rated ? (
        <Panel tone="mustard" className="p-4">
          <p className="font-sign font-bold uppercase tracking-wide">Thanks — customer rated.</p>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Lead credits"
          value={tradie.lead_credits}
          hint={`${MEMBERSHIP_LABEL[tradie.membership_tier]} member`}
          tone="safety"
          href="/tradie/billing"
        />
        <StatTile label="Live quotes" value={liveBids.length} tone="navy" href="/tradie/bids" />
        <StatTile
          label="Win rate"
          value={`${winRate}%`}
          hint={`${won.length} of ${bids.length} quotes`}
          tone="bottle"
        />
        <StatTile
          label="Your rating"
          value={tradie.total_reviews ? rating1dp(tradie.average_rating) : '—'}
          hint={`${tradie.total_reviews} reviews · ${tradie.completed_jobs} jobs`}
          tone="mustard"
          href="/tradie/reviews"
        />
      </div>

      {tradie.lead_credits === 0 ? (
        <Panel tone="mustard" className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-sign text-lg font-bold uppercase tracking-wide">Out of lead credits</p>
            <p className="mt-1 text-sm text-ink-soft">
              You need credits to submit a quote. Packs start at $39 for ten.
            </p>
          </div>
          <Link href="/tradie/billing" className="btn-oxide btn-sm">
            Top up
          </Link>
        </Panel>
      ) : null}

      {pending.length ? (
        <section>
          <SectionHeading
            eyebrow="Your turn"
            title="Rate your customers"
            blurb="Customer ratings are public to other tradies quoting on their next job."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((item) => (
              <Panel key={item.job_id} tone="mustard" className="p-5">
                <p className="font-mono text-xs text-ink-mute">{item.reference}</p>
                <h3 className="mt-1 font-sign text-lg font-bold uppercase leading-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-soft">Customer: {item.other_name}</p>
                <Link href={`/tradie/jobs/${item.job_id}/review`} className="btn-oxide btn-sm mt-4 w-full">
                  Rate the customer
                </Link>
              </Panel>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeading
          eyebrow="Fresh in your trades"
          title="Job leads for you"
          action={
            <Link href="/tradie/leads" className="btn-navy btn-sm">
              See all leads
            </Link>
          }
        />
        {leads.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {leads.map((job) => (
              <JobCard key={job.id} job={job} href={`/tradie/leads/${job.id}`} cta="View &amp; quote" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📡"
            title="No matching leads right now"
            blurb="Widen your trades or service areas in your listing and more work will land here."
            action={
              <Link href="/tradie/profile" className="btn-primary">
                Edit my listing
              </Link>
            }
          />
        )}
      </section>

      {liveBids.length ? (
        <section>
          <SectionHeading eyebrow="Waiting on the customer" title="Quotes in play" />
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Suburb</th>
                  <th className="px-4 py-3">Quoted</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                </tr>
              </thead>
              <tbody>
                {liveBids.slice(0, 8).map((bid) => (
                  <tr key={bid.id} className="border-b border-dashed border-ink/20">
                    <td className="px-4 py-3 font-semibold">{bid.job_title}</td>
                    <td className="px-4 py-3 text-ink-soft">{bid.job_suburb}</td>
                    <td className="px-4 py-3 font-mono">{money(bid.amount)}</td>
                    <td className="px-4 py-3">
                      <Pill className={bidStatusTone(bid.status)}>{BID_STATUS_LABEL[bid.status]}</Pill>
                    </td>
                    <td className="px-4 py-3 text-ink-mute">{timeAgo(bid.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel tone="navy" className="p-6">
          <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
            Work in the pipeline
          </h2>
          <p className="mt-3 font-display text-4xl leading-none">{money(pipeline)}</p>
          <p className="mt-2 text-sm text-canvas/80">
            Accepted quotes not yet signed off. {won.filter((b) => b.job_status !== 'COMPLETED').length}{' '}
            job(s) on the go.
          </p>
          <Link href="/tradie/jobs" className="btn-primary btn-sm mt-4">
            View won jobs
          </Link>
        </Panel>

        {notifications.length ? (
          <Panel className="divide-y-2 divide-dashed divide-ink/20">
            {notifications.map((note) => (
              <div key={note.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-sign text-sm font-bold uppercase tracking-wide">{note.title}</p>
                  {note.body ? <p className="mt-0.5 text-sm text-ink-soft">{note.body}</p> : null}
                </div>
                <span className="shrink-0 text-xs text-ink-mute">{timeAgo(note.created_at)}</span>
              </div>
            ))}
          </Panel>
        ) : (
          <Panel className="p-6">
            <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em]">Your listing</h2>
            <div className="mt-3">
              <Stars value={tradie.average_rating} showValue count={tradie.total_reviews} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {tradie.profile_views} people have looked at your profile.
            </p>
            <Link href={`/find-a-tradie/${tradie.slug}`} className="btn-ghost btn-sm mt-4">
              View my public listing
            </Link>
          </Panel>
        )}
      </div>
    </div>
  )
}
