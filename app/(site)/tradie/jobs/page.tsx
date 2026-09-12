import Link from 'next/link'
import { auth } from '@/lib/auth'
import { EmptyState, Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import Stars from '@/components/Stars'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { jobsForTradie } from '@/lib/repos/jobs'
import { bidsForTradie } from '@/lib/repos/bids'
import { pendingReviewsFor } from '@/lib/repos/reviews'
import { JOB_STATUS_LABEL, jobStatusTone, money, formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function WonJobsPage() {
  const session = await auth()
  if (!session?.user) return null

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return null

  const [jobs, bids, pending] = await Promise.all([
    jobsForTradie(tradie.id, 100),
    bidsForTradie(tradie.id, 200),
    pendingReviewsFor(session.user.id, 'TRADESPERSON'),
  ])

  const amountFor = (jobId: string) => bids.find((b) => b.job_id === jobId && b.status === 'ACCEPTED')?.amount ?? 0
  const active = jobs.filter((j) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')
  const completed = jobs.filter((j) => j.status === 'COMPLETED')
  const pendingIds = new Set(pending.map((p) => p.job_id))

  const earned = completed.reduce((total, j) => total + amountFor(j.id), 0)
  const pipeline = active.reduce((total, j) => total + amountFor(j.id), 0)

  return (
    <div className="space-y-8">
      <SectionHeading eyebrow="Won work" title="Jobs you've been hired for" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="On the go" value={active.length} hint={money(pipeline)} tone="safety" />
        <StatTile label="Completed" value={completed.length} hint={money(earned)} tone="bottle" />
        <StatTile
          label="Your rating"
          value={tradie.total_reviews ? tradie.average_rating.toFixed(1) : '—'}
          hint={`${tradie.total_reviews} reviews`}
          tone="mustard"
        />
      </div>

      {jobs.length ? (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Panel key={job.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-ink-mute">{job.reference}</span>
                    <Pill className={jobStatusTone(job.status)}>{JOB_STATUS_LABEL[job.status]}</Pill>
                  </div>
                  <h3 className="mt-1 font-sign text-lg font-bold uppercase tracking-wide">
                    {job.title}
                  </h3>
                  <p className="mt-1 text-sm text-ink-mute">
                    {job.client_name} · {job.suburb}, {job.state} {job.postcode}
                  </p>
                  {job.address && job.status !== 'COMPLETED' ? (
                    <p className="mt-2 border-l-4 border-safety bg-canvas-deep px-3 py-1.5 text-sm">
                      <strong className="font-sign uppercase tracking-wide">Address:</strong>{' '}
                      {job.address}, {job.suburb} {job.postcode}
                    </p>
                  ) : null}
                  {job.client_review_count ? (
                    <div className="mt-2">
                      <Stars value={job.client_rating} size="sm" showValue count={job.client_review_count} />
                    </div>
                  ) : null}
                </div>

                <div className="text-right">
                  <p className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">
                    Agreed price
                  </p>
                  <p className="font-display text-3xl leading-none">{money(amountFor(job.id))}</p>
                  {job.completed_at ? (
                    <p className="mt-1 text-xs text-ink-mute">Signed off {formatDate(job.completed_at)}</p>
                  ) : null}
                  {pendingIds.has(job.id) ? (
                    <Link href={`/tradie/jobs/${job.id}/review`} className="btn-oxide btn-sm mt-3">
                      Rate the customer
                    </Link>
                  ) : null}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="✅"
          title="No won jobs yet"
          blurb="Quote on a few leads. A sharp, detailed quote wins more often than the cheapest one."
          action={
            <Link href="/tradie/leads" className="btn-primary">
              Find work
            </Link>
          }
        />
      )}
    </div>
  )
}
