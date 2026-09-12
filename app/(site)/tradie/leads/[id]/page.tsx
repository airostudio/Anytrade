import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import Stars from '@/components/Stars'
import { Panel, Pill, Stamp } from '@/components/ui'
import { getJob, recordJobView } from '@/lib/repos/jobs'
import { bidStats, getBidForJobAndTradie } from '@/lib/repos/bids'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { BID_CREDIT_COST, categoryName } from '@/lib/constants'
import {
  budgetRange,
  formatDate,
  JOB_SIZE_LABEL,
  JOB_STATUS_LABEL,
  JOB_URGENCY_LABEL,
  jobStatusTone,
  money,
  rating1dp,
  timeAgo,
} from '@/lib/utils'
import BidForm from './BidForm'

export const dynamic = 'force-dynamic'

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return null

  const [tradie, job] = await Promise.all([getTradieByUserId(session.user.id), getJob(params.id)])
  if (!tradie || !job) notFound()

  const [stats, existing] = await Promise.all([
    bidStats(job.id),
    getBidForJobAndTradie(job.id, tradie.id),
  ])

  recordJobView(job.id).catch(() => {})

  const cost = BID_CREDIT_COST[job.job_size] ?? 1
  const slotsLeft = Math.max(0, job.max_bids - job.bid_count)
  const openForQuotes = ['OPEN', 'SHORTLISTING'].includes(job.status) && slotsLeft > 0
  const blockedByHomegirls = job.prefer_homegirl && !tradie.is_homegirl

  return (
    <div className="space-y-8">
      <Link href="/tradie/leads" className="inline-block text-sm text-ink-mute underline-offset-4 hover:underline">
        ← Back to leads
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Panel className="p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink bg-canvas-deep px-5 py-3">
              <span className="font-mono text-sm font-bold">{job.reference}</span>
              <div className="flex flex-wrap gap-2">
                <Pill className={jobStatusTone(job.status)}>{JOB_STATUS_LABEL[job.status]}</Pill>
                {job.urgency === 'EMERGENCY' ? (
                  <Pill className="border-ink bg-oxide text-canvas">Emergency</Pill>
                ) : null}
                {job.prefer_homegirl ? (
                  <Pill className="border-oxide bg-canvas text-oxide">Homegirls only</Pill>
                ) : null}
              </div>
            </div>

            <div className="p-6">
              <h1 className="font-display text-2xl leading-tight sm:text-3xl">{job.title}</h1>
              <p className="mt-1 text-ink-mute">
                {categoryName(job.category)} · {job.suburb}, {job.state} {job.postcode} · posted{' '}
                {timeAgo(job.created_at)}
              </p>

              <p className="mt-5 whitespace-pre-line text-ink-soft">{job.description}</p>

              <dl className="mt-6 grid gap-4 border-t-2 border-dashed border-ink/25 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                <Fact label="Customer budget" value={budgetRange(job.budget_min, job.budget_max)} />
                <Fact label="Size" value={JOB_SIZE_LABEL[job.job_size]} />
                <Fact label="Timing" value={JOB_URGENCY_LABEL[job.urgency]} />
                <Fact label="Preferred date" value={formatDate(job.preferred_date)} />
              </dl>

              <p className="mt-5 border-t-2 border-dashed border-ink/25 pt-4 text-sm text-ink-mute">
                The exact address and the customer&apos;s phone number are released once they accept
                your quote.
              </p>
            </div>
          </Panel>

          {existing ? (
            <Panel tone="navy" className="p-6">
              <Stamp tone="mustard" className="mb-3 bg-canvas">
                Quote submitted
              </Stamp>
              <p className="font-display text-3xl">{money(existing.amount)}</p>
              <p className="mt-2 text-canvas/85">{existing.message}</p>
              <p className="mt-3 text-sm text-canvas/70">
                Sent {timeAgo(existing.created_at)} ·{' '}
                {existing.seen_by_client ? 'Opened by the customer' : 'Not opened yet'}
              </p>
              <Link href="/tradie/bids" className="btn-primary btn-sm mt-4">
                Manage my quotes
              </Link>
            </Panel>
          ) : blockedByHomegirls ? (
            <Panel tone="mustard" className="p-6">
              <h2 className="font-sign text-lg font-bold uppercase tracking-wide">
                Homegirls members only
              </h2>
              <p className="mt-2 text-sm text-ink-soft">
                This customer asked for a woman tradesperson. Apply to the Homegirls network if that is
                you.
              </p>
              <Link href="/homegirls" className="btn-oxide btn-sm mt-4">
                About Homegirls
              </Link>
            </Panel>
          ) : openForQuotes ? (
            <Panel className="p-6">
              <h2 className="mb-4 border-b-[3px] border-safety pb-2 font-sign text-xl font-bold uppercase tracking-wide">
                Put your price in
              </h2>
              <BidForm
                jobId={job.id}
                creditCost={cost}
                creditsAvailable={tradie.lead_credits}
                budgetHint={budgetRange(job.budget_min, job.budget_max)}
              />
            </Panel>
          ) : (
            <Panel tone="manila" className="p-6">
              <h2 className="font-sign text-lg font-bold uppercase tracking-wide">Quotes are closed</h2>
              <p className="mt-2 text-sm text-ink-soft">
                {slotsLeft === 0
                  ? 'This job already has the maximum number of quotes.'
                  : 'The customer is no longer taking quotes on this job.'}
              </p>
            </Panel>
          )}
        </div>

        <aside className="space-y-5">
          <Panel className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
              The competition
            </h2>
            <dl className="space-y-3 text-sm">
              <Row label="Quotes in" value={`${stats.total} of ${job.max_bids}`} />
              <Row label="Slots left" value={String(slotsLeft)} />
              <Row label="Lowest quote" value={stats.lowest ? money(stats.lowest) : '—'} />
              <Row label="Average quote" value={stats.average ? money(stats.average) : '—'} />
              <Row label="Highest quote" value={stats.highest ? money(stats.highest) : '—'} />
              <Row label="Job views" value={String(job.view_count)} />
            </dl>
            <p className="mt-4 border-t-2 border-dashed border-ink/25 pt-3 text-xs text-ink-mute">
              Quote ranges are shown so you can price sensibly — the customer sees the same numbers.
            </p>
          </Panel>

          <Panel tone="manila" className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
              The customer
            </h2>
            <p className="font-semibold">{job.client_name}</p>
            <p className="text-sm text-ink-mute">{job.client_suburb ?? job.suburb}</p>
            <div className="mt-2">
              {job.client_review_count ? (
                <>
                  <Stars value={job.client_rating} size="sm" showValue count={job.client_review_count} />
                  <p className="mt-1 text-xs text-ink-mute">
                    Rated {rating1dp(job.client_rating)} by tradies who have worked for them.
                  </p>
                </>
              ) : (
                <p className="text-xs text-ink-mute">No tradie ratings yet — new customer.</p>
              )}
            </div>
          </Panel>

          <Panel tone="navy" className="p-5">
            <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
              Cost to quote
            </h2>
            <p className="mt-2 font-display text-4xl leading-none">
              {cost} <span className="font-body text-base">credit{cost === 1 ? '' : 's'}</span>
            </p>
            <p className="mt-2 text-sm text-canvas/80">
              You have {tradie.lead_credits}. Credits come back if the customer cancels before anyone
              is hired.
            </p>
            <Link href="/tradie/billing" className="btn-primary btn-sm mt-4">
              Top up credits
            </Link>
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="font-semibold text-ink">{value}</dd>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink-mute">{label}</dt>
      <dd className="font-mono font-bold">{value}</dd>
    </div>
  )
}
