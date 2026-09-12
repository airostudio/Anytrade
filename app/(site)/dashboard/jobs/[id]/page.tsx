import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import Stars from '@/components/Stars'
import { EmptyState, Panel, Pill, Stamp } from '@/components/ui'
import { getJob } from '@/lib/repos/jobs'
import { bidStats, bidsForJob, markBidsSeen } from '@/lib/repos/bids'
import { paymentsForJob } from '@/lib/repos/payments'
import { reviewsForJob } from '@/lib/repos/reviews'
import { categoryName } from '@/lib/constants'
import { cancelJob, markJobComplete, startJob } from '@/app/actions/jobs'
import { releaseJobPayment } from '@/app/actions/billing'
import {
  budgetRange,
  formatDate,
  JOB_SIZE_LABEL,
  JOB_STATUS_LABEL,
  JOB_URGENCY_LABEL,
  jobStatusTone,
  money,
  paymentStatusTone,
  PAYMENT_STATUS_LABEL,
  timeAgo,
} from '@/lib/utils'
import BidActions from './BidActions'
import PayButtons from './PayButtons'

export const dynamic = 'force-dynamic'

export default async function ClientJobPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { posted?: string; paid?: string; demo?: string; cancelled?: string }
}) {
  const session = await auth()
  if (!session?.user) return null

  const job = await getJob(params.id)
  if (!job || job.client_id !== session.user.id) notFound()

  const [bids, stats, payments, reviews] = await Promise.all([
    bidsForJob(job.id),
    bidStats(job.id),
    paymentsForJob(job.id),
    reviewsForJob(job.id),
  ])

  // Let the tradies know their quote has been opened.
  markBidsSeen(job.id).catch(() => {})

  const accepted = bids.find((b) => b.status === 'ACCEPTED')
  const live = bids.filter((b) => ['PENDING', 'SHORTLISTED'].includes(b.status))
  const declined = bids.filter((b) => b.status === 'DECLINED')
  const escrow = payments.find((p) => p.status === 'HELD_IN_ESCROW')
  const paid = payments.find((p) => p.status === 'RELEASED')
  const myReview = reviews.find(
    (r) => r.reviewer_id === session.user.id && r.direction === 'CLIENT_TO_TRADIE'
  )
  const canChoose = ['OPEN', 'SHORTLISTING'].includes(job.status)

  return (
    <div className="space-y-8">
      <Link href="/dashboard" className="inline-block text-sm text-ink-mute underline-offset-4 hover:underline">
        ← All my jobs
      </Link>

      {searchParams.posted ? (
        <Panel tone="mustard" className="p-5">
          <p className="font-sign text-lg font-bold uppercase tracking-wide">Job is live</p>
          <p className="mt-1 text-sm text-ink-soft">
            Reference <strong className="font-mono">{job.reference}</strong>. Tradies in{' '}
            {job.suburb} can see it now — most quotes land within a few hours.
          </p>
        </Panel>
      ) : null}

      {searchParams.paid || searchParams.demo === 'paid' ? (
        <Panel tone="mustard" className="p-5">
          <p className="font-sign text-lg font-bold uppercase tracking-wide">
            Payment held in escrow
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {searchParams.demo === 'paid'
              ? 'Demo mode — no card was charged. We release it to the tradie when you sign the job off.'
              : 'We release it to your tradie the moment you mark the job complete.'}
          </p>
        </Panel>
      ) : null}

      {/* Job summary */}
      <Panel className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-ink bg-canvas-deep px-5 py-3">
          <span className="font-mono text-sm font-bold">{job.reference}</span>
          <div className="flex flex-wrap gap-2">
            <Pill className={jobStatusTone(job.status)}>{JOB_STATUS_LABEL[job.status]}</Pill>
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

          <dl className="mt-6 grid gap-4 border-t-2 border-dashed border-ink/25 pt-5 sm:grid-cols-2 lg:grid-cols-5">
            <Fact label="Budget" value={budgetRange(job.budget_min, job.budget_max)} />
            <Fact label="Size" value={JOB_SIZE_LABEL[job.job_size]} />
            <Fact label="Timing" value={JOB_URGENCY_LABEL[job.urgency]} />
            <Fact label="Preferred date" value={formatDate(job.preferred_date)} />
            <Fact label="Views" value={String(job.view_count)} />
          </dl>

          {canChoose ? (
            <form action={cancelJob} className="mt-6 flex flex-wrap items-end gap-3 border-t-2 border-dashed border-ink/25 pt-5">
              <input type="hidden" name="jobId" value={job.id} />
              <div className="flex-1">
                <label className="label" htmlFor="reason">
                  Changed your mind?
                </label>
                <input
                  id="reason"
                  name="reason"
                  placeholder="Reason (optional)"
                  className="field border-2 py-2"
                />
              </div>
              <button type="submit" className="btn-ghost btn-sm">
                Cancel this job
              </button>
            </form>
          ) : null}
        </div>
      </Panel>

      {/* Accepted quote + payment */}
      {accepted ? (
        <Panel tone="navy" className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Stamp tone="mustard" className="mb-3 bg-canvas">
                Hired
              </Stamp>
              <h2 className="font-display text-2xl leading-tight">{accepted.business_name}</h2>
              <p className="mt-1 text-canvas/80">
                {accepted.tradie_name} · {accepted.base_suburb ?? 'Local'}
              </p>
              <div className="mt-2">
                <Stars value={accepted.average_rating} showValue count={accepted.total_reviews} />
              </div>
            </div>
            <div className="text-right">
              <p className="font-sign text-xs uppercase tracking-widest text-canvas/70">Agreed price</p>
              <p className="font-display text-4xl leading-none text-safety">{money(accepted.amount)}</p>
              <p className="mt-1 text-xs text-canvas/70">
                {accepted.includes_gst ? 'GST included' : 'Plus GST'}
                {accepted.includes_materials ? ' · materials included' : ' · materials extra'}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t-2 border-canvas/25 pt-5">
            <PayButtons
              jobId={job.id}
              jobStatus={job.status}
              escrowPaymentId={escrow?.id ?? null}
              escrowAmount={escrow?.amount ?? null}
              alreadyPaid={Boolean(paid)}
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3 border-t-2 border-canvas/25 pt-5">
            {job.status === 'AWARDED' ? (
              <form action={startJob}>
                <input type="hidden" name="jobId" value={job.id} />
                <button type="submit" className="btn-ghost btn-sm">
                  Mark work started
                </button>
              </form>
            ) : null}

            {['AWARDED', 'IN_PROGRESS'].includes(job.status) ? (
              <form action={markJobComplete}>
                <input type="hidden" name="jobId" value={job.id} />
                <button type="submit" className="btn-primary btn-sm">
                  Job&apos;s done — sign it off
                </button>
              </form>
            ) : null}

            {job.status === 'COMPLETED' && !myReview ? (
              <Link href={`/dashboard/jobs/${job.id}/review`} className="btn-primary btn-sm">
                Rate {accepted.business_name}
              </Link>
            ) : null}

            {myReview ? (
              <p className="text-sm text-canvas/80">
                You rated this job {myReview.rating}/5 on {formatDate(myReview.created_at)}.
              </p>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {/* Bid comparison */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">The quotes</span>
            <h2 className="font-sign text-2xl font-bold uppercase tracking-wide">
              {stats.total} of {job.max_bids} received
            </h2>
          </div>
          {stats.total > 1 ? (
            <dl className="flex flex-wrap gap-5 text-sm">
              <div>
                <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">Lowest</dt>
                <dd className="font-display text-xl text-bottle">{money(stats.lowest)}</dd>
              </div>
              <div>
                <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">Average</dt>
                <dd className="font-display text-xl">{money(stats.average)}</dd>
              </div>
              <div>
                <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">Highest</dt>
                <dd className="font-display text-xl text-oxide">{money(stats.highest)}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        {live.length || accepted ? (
          <ul className="space-y-4">
            {[...live, ...(accepted ? [accepted] : [])]
              .filter((bid, i, arr) => arr.findIndex((b) => b.id === bid.id) === i)
              .map((bid) => {
                const isLowest = stats.lowest !== null && bid.amount === stats.lowest
                return (
                  <li key={bid.id}>
                    <Panel
                      className={`p-5 ${bid.status === 'ACCEPTED' ? 'border-bottle' : ''} ${
                        bid.is_shortlisted ? 'bg-canvas-deep' : ''
                      }`}
                    >
                      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-sign text-lg font-bold uppercase tracking-wide">
                              <Link href={`/find-a-tradie/${bid.slug}`} className="hover:text-oxide">
                                {bid.business_name}
                              </Link>
                            </h3>
                            {bid.verification_status === 'VERIFIED' ? (
                              <Pill className="border-bottle bg-bottle text-canvas">✓ Verified</Pill>
                            ) : null}
                            {bid.is_homegirl ? (
                              <Pill className="border-oxide bg-oxide text-canvas">Homegirl</Pill>
                            ) : null}
                            {isLowest && stats.total > 1 ? (
                              <Pill className="border-ink bg-mustard text-ink">Lowest quote</Pill>
                            ) : null}
                            {bid.is_shortlisted ? (
                              <Pill className="border-ink bg-safety text-ink">Shortlisted</Pill>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink-mute">
                            <Stars value={bid.average_rating} size="sm" showValue count={bid.total_reviews} />
                            <span>{bid.completed_jobs} jobs done</span>
                            {bid.years_experience ? <span>{bid.years_experience} yrs experience</span> : null}
                            <span>Quoted {timeAgo(bid.created_at)}</span>
                          </div>

                          <p className="mt-3 whitespace-pre-line text-ink-soft">{bid.message}</p>

                          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t-2 border-dashed border-ink/25 pt-3 text-sm">
                            <Mini label="Materials" value={bid.includes_materials ? 'Included' : 'Extra'} />
                            <Mini label="GST" value={bid.includes_gst ? 'Included' : 'Plus GST'} />
                            <Mini
                              label="Time on site"
                              value={
                                bid.estimated_hours
                                  ? `${bid.estimated_hours} hrs`
                                  : bid.estimated_days
                                    ? `${bid.estimated_days} day${bid.estimated_days === 1 ? '' : 's'}`
                                    : '—'
                              }
                            />
                            <Mini label="Can start" value={formatDate(bid.available_from)} />
                            <Mini
                              label="Warranty"
                              value={bid.warranty_months ? `${bid.warranty_months} months` : '—'}
                            />
                          </dl>
                        </div>

                        <div className="flex shrink-0 flex-col items-stretch justify-between gap-3 lg:w-56">
                          <div className="border-[3px] border-ink bg-manila px-4 py-3 text-center">
                            <p className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">
                              Quoted
                            </p>
                            <p className="font-display text-3xl leading-none">{money(bid.amount)}</p>
                          </div>

                          {canChoose ? (
                            <BidActions
                              bidId={bid.id}
                              jobId={job.id}
                              shortlisted={bid.is_shortlisted}
                              businessName={bid.business_name}
                              amount={money(bid.amount)}
                            />
                          ) : bid.status === 'ACCEPTED' ? (
                            <Pill className="justify-center border-bottle bg-bottle py-2 text-canvas">
                              Accepted
                            </Pill>
                          ) : null}

                          <Link href={`/find-a-tradie/${bid.slug}`} className="btn-ghost btn-sm">
                            Profile &amp; reviews
                          </Link>
                        </div>
                      </div>
                    </Panel>
                  </li>
                )
              })}
          </ul>
        ) : (
          <EmptyState
            icon="📨"
            title="No quotes just yet"
            blurb={
              job.status === 'OPEN'
                ? 'Tradies in your area have been notified. Most jobs get their first quote within a few hours.'
                : 'This job is no longer taking quotes.'
            }
          />
        )}

        {declined.length ? (
          <details className="mt-6">
            <summary className="cursor-pointer font-sign text-sm font-bold uppercase tracking-wide text-ink-mute">
              {declined.length} declined quote{declined.length === 1 ? '' : 's'}
            </summary>
            <ul className="mt-3 space-y-2">
              {declined.map((bid) => (
                <li
                  key={bid.id}
                  className="flex items-center justify-between border-2 border-ink/30 bg-canvas-deep px-4 py-2 text-sm"
                >
                  <span>{bid.business_name}</span>
                  <span className="font-mono">{money(bid.amount)}</span>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </section>

      {/* Payments */}
      {payments.length ? (
        <section>
          <span className="eyebrow">Money</span>
          <h2 className="mb-4 font-sign text-2xl font-bold uppercase tracking-wide">Payments</h2>
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-dashed border-ink/20">
                    <td className="px-4 py-3">{formatDate(payment.created_at)}</td>
                    <td className="px-4 py-3">{payment.description ?? payment.type}</td>
                    <td className="px-4 py-3 font-mono">{money(payment.amount, true)}</td>
                    <td className="px-4 py-3">
                      <Pill className={paymentStatusTone(payment.status)}>
                        {PAYMENT_STATUS_LABEL[payment.status]}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {payment.status === 'HELD_IN_ESCROW' ? (
                        <form action={releaseJobPayment}>
                          <input type="hidden" name="paymentId" value={payment.id} />
                          <button type="submit" className="btn-ghost btn-sm">
                            Release
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>
      ) : null}
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

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}
