import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Stars from '@/components/Stars'
import { Panel, Pill, Stamp } from '@/components/ui'
import { categoryName, getCategory, RATING_CRITERIA } from '@/lib/constants'
import { getTradieBySlug, recordProfileView } from '@/lib/repos/tradies'
import { ratingBreakdown, reviewsForTradie, topTags } from '@/lib/repos/reviews'
import { formatDate, initials, money, rating1dp, timeAgo, MEMBERSHIP_LABEL } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const tradie = await getTradieBySlug(params.slug)
  if (!tradie) return { title: 'Tradie not found' }
  return {
    title: `${tradie.business_name} — ${tradie.trades.map(categoryName).join(', ')}`,
    description:
      tradie.tagline ??
      `${tradie.business_name} in ${tradie.base_suburb ?? 'your area'}. ${rating1dp(tradie.average_rating)} stars from ${tradie.total_reviews} reviews on AnyTrade.`,
  }
}

export default async function TradieProfilePage({ params }: { params: { slug: string } }) {
  const tradie = await getTradieBySlug(params.slug)
  if (!tradie || tradie.is_suspended) notFound()

  const [reviews, breakdown, tags] = await Promise.all([
    reviewsForTradie(tradie.id, 12),
    ratingBreakdown(tradie.id),
    topTags(tradie.id, 6),
  ])

  // Fire-and-forget: a view counter must never block the render.
  recordProfileView(tradie.id).catch(() => {})

  const verified = tradie.verification_status === 'VERIFIED'
  const subRatings = [
    { label: 'Quality of work', value: tradie.rating_quality },
    { label: 'Turned up on time', value: tradie.rating_punctuality },
    { label: 'Value for money', value: tradie.rating_value },
    { label: 'Communication', value: tradie.rating_communication },
    { label: 'Left it tidy', value: tradie.rating_tidiness },
  ]

  return (
    <>
      {/* Header board */}
      <section className="border-b-[3px] border-ink bg-navy text-canvas">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Link href="/find-a-tradie" className="text-sm text-canvas/70 underline-offset-4 hover:underline">
            ← Back to the directory
          </Link>

          <div className="mt-5 flex flex-wrap items-start gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center border-[3px] border-ink bg-safety font-display text-3xl text-ink shadow-hard">
              {initials(tradie.business_name)}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl leading-tight sm:text-4xl">{tradie.business_name}</h1>
              <p className="mt-1 text-canvas/80">
                {tradie.name}
                {tradie.base_suburb ? ` · ${tradie.base_suburb}, ${tradie.state ?? ''}` : ''}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <Stars value={tradie.average_rating} showValue count={tradie.total_reviews} />
                <span className="text-sm text-canvas/75">
                  {tradie.completed_jobs} jobs completed through AnyTrade
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {verified ? (
                  <Pill className="border-canvas bg-bottle text-canvas">✓ Licence &amp; insurance checked</Pill>
                ) : (
                  <Pill className="border-canvas/50 bg-transparent text-canvas/80">Verification pending</Pill>
                )}
                {tradie.accepts_small_jobs ? (
                  <Pill className="border-ink bg-mustard text-ink">Takes small jobs</Pill>
                ) : null}
                {tradie.emergency_callouts ? (
                  <Pill className="border-ink bg-oxide text-canvas">Emergency call-outs</Pill>
                ) : null}
                {tradie.available_weekends ? (
                  <Pill className="border-canvas bg-transparent text-canvas">Weekends</Pill>
                ) : null}
                {tradie.is_homegirl ? (
                  <Pill className="border-ink bg-safety text-ink">Homegirls member</Pill>
                ) : null}
                {tradie.membership_tier !== 'FREE' ? (
                  <Pill className="border-canvas bg-transparent text-canvas">
                    {MEMBERSHIP_LABEL[tradie.membership_tier]} member
                  </Pill>
                ) : null}
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <Panel className="p-5 sm:w-72">
                <p className="font-sign text-xs uppercase tracking-[0.2em] text-ink-mute">Indicative rates</p>
                <p className="mt-1 font-display text-3xl leading-none text-ink">
                  {tradie.hourly_rate ? `${money(tradie.hourly_rate)}` : 'On quote'}
                  {tradie.hourly_rate ? <span className="font-body text-base"> /hr</span> : null}
                </p>
                <dl className="mt-3 space-y-1 text-sm text-ink-soft">
                  <Row label="Call-out" value={tradie.callout_fee ? money(tradie.callout_fee) : 'None'} />
                  <Row
                    label="Minimum charge"
                    value={tradie.minimum_charge ? money(tradie.minimum_charge) : '—'}
                  />
                  <Row label="Quotes" value={tradie.free_quotes ? 'Free' : 'Chargeable'} />
                  <Row label="Travels" value={`${tradie.travel_radius_km} km`} />
                </dl>
                <Link href={`/post-a-job?category=${tradie.trades[0] ?? ''}`} className="btn-primary btn-sm mt-4 w-full">
                  Request a quote
                </Link>
                <p className="mt-2 text-center text-xs text-ink-mute">
                  Post the job and {tradie.business_name.split(' ')[0]} will see it in their feed.
                </p>
              </Panel>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {/* About */}
          <Panel className="p-6">
            <h2 className="mb-3 border-b-[3px] border-safety pb-2 font-sign text-xl font-bold uppercase tracking-wide">
              About {tradie.business_name}
            </h2>
            {tradie.tagline ? (
              <p className="mb-3 font-display text-xl leading-snug text-oxide">“{tradie.tagline}”</p>
            ) : null}
            <p className="whitespace-pre-line text-ink-soft">
              {tradie.bio ?? 'This tradie has not written a profile blurb yet.'}
            </p>

            <div className="mt-6 grid gap-4 border-t-2 border-dashed border-ink/25 pt-5 sm:grid-cols-3">
              <Fact label="Years in the trade" value={tradie.years_experience ? `${tradie.years_experience}` : '—'} />
              <Fact label="Jobs completed" value={String(tradie.completed_jobs)} />
              <Fact label="On AnyTrade since" value={formatDate(tradie.created_at)} />
            </div>
          </Panel>

          {/* Services */}
          <Panel className="p-6">
            <h2 className="mb-4 border-b-[3px] border-safety pb-2 font-sign text-xl font-bold uppercase tracking-wide">
              What they do
            </h2>
            <div className="flex flex-wrap gap-2">
              {tradie.trades.map((trade) => (
                <Link
                  key={trade}
                  href={`/trades/${trade}`}
                  className="border-[3px] border-ink bg-canvas-deep px-3 py-1.5 font-sign text-sm font-bold uppercase tracking-wide hover:bg-safety"
                >
                  {getCategory(trade)?.icon} {categoryName(trade)}
                </Link>
              ))}
            </div>

            {tradie.handyman_services.length ? (
              <div className="mt-6">
                <h3 className="mb-2 font-sign text-sm font-bold uppercase tracking-[0.2em] text-ink-mute">
                  Handyman jobs they take
                </h3>
                <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {tradie.handyman_services.map((service) => (
                    <li key={service} className="flex items-start gap-2 text-sm text-ink-soft">
                      <span className="mt-0.5 font-bold text-bottle" aria-hidden>
                        ✓
                      </span>
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Panel>

          {/* Reviews */}
          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-sign text-2xl font-bold uppercase tracking-wide">
                Ratings &amp; reviews
              </h2>
              <span className="text-sm text-ink-mute">
                From customers with a completed job. No anonymous reviews.
              </span>
            </div>

            <Panel className="mb-5 p-6">
              <div className="grid gap-6 sm:grid-cols-[180px_1fr]">
                <div className="text-center">
                  <p className="font-display text-5xl leading-none text-ink">
                    {rating1dp(tradie.average_rating)}
                  </p>
                  <Stars value={tradie.average_rating} className="mt-2 justify-center" />
                  <p className="mt-1 text-sm text-ink-mute">{tradie.total_reviews} reviews</p>
                </div>

                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const n = breakdown[star] ?? 0
                    const pct = tradie.total_reviews ? (n / tradie.total_reviews) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-3 text-sm">
                        <span className="w-8 font-mono text-ink-mute">{star}★</span>
                        <span className="h-3 flex-1 border-2 border-ink bg-canvas-deep">
                          <span className="block h-full bg-safety" style={{ width: `${pct}%` }} />
                        </span>
                        <span className="w-8 text-right font-mono text-ink-mute">{n}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {tradie.total_reviews > 0 ? (
                <div className="mt-6 grid gap-3 border-t-2 border-dashed border-ink/25 pt-5 sm:grid-cols-2 lg:grid-cols-5">
                  {subRatings.map((item) => (
                    <div key={item.label}>
                      <p className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">
                        {item.label}
                      </p>
                      <p className="font-display text-xl text-ink">{rating1dp(item.value)}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {tags.length ? (
                <div className="mt-5 flex flex-wrap gap-2 border-t-2 border-dashed border-ink/25 pt-5">
                  {tags.map((tag) => (
                    <Pill key={tag.tag} className="border-ink bg-mustard text-ink">
                      {tag.tag} · {tag.n}
                    </Pill>
                  ))}
                </div>
              ) : null}
            </Panel>

            {reviews.length ? (
              <ul className="space-y-4">
                {reviews.map((review) => (
                  <li key={review.id}>
                    <Panel className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Stars value={review.rating} size="sm" showValue />
                          <p className="mt-1 text-sm text-ink-mute">
                            {review.reviewer_name}
                            {review.reviewer_suburb ? ` · ${review.reviewer_suburb}` : ''} ·{' '}
                            {timeAgo(review.created_at)}
                          </p>
                        </div>
                        <Pill className="border-ink bg-canvas-deep text-ink-soft">
                          {categoryName(review.job_category)}
                        </Pill>
                      </div>

                      {review.comment ? (
                        <p className="mt-3 text-ink-soft">“{review.comment}”</p>
                      ) : null}

                      {review.tags.length ? (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {review.tags.map((tag) => (
                            <Pill key={tag} className="border-bottle bg-transparent text-bottle">
                              {tag}
                            </Pill>
                          ))}
                        </div>
                      ) : null}

                      {review.response ? (
                        <div className="mt-4 border-l-4 border-safety bg-canvas-deep p-3">
                          <p className="font-sign text-xs uppercase tracking-widest text-ink-mute">
                            Reply from {tradie.business_name}
                          </p>
                          <p className="mt-1 text-sm text-ink-soft">{review.response}</p>
                        </div>
                      ) : null}
                    </Panel>
                  </li>
                ))}
              </ul>
            ) : (
              <Panel className="p-6 text-ink-soft">
                No reviews yet. Ratings appear here as soon as a customer signs off a job.
              </Panel>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <Panel tone="manila" className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">Credentials</h2>
            <dl className="space-y-2 text-sm">
              <Row label="ABN" value={tradie.abn ?? 'Not supplied'} />
              <Row label="Licence" value={tradie.licence_number ?? 'Not supplied'} />
              <Row label="Licence expiry" value={formatDate(tradie.licence_expiry)} />
              <Row label="Insurer" value={tradie.insurer_name ?? 'Not supplied'} />
              <Row label="Insured until" value={formatDate(tradie.insurance_expiry)} />
            </dl>
            {verified ? (
              <div className="mt-4">
                <Stamp tone="bottle" className="bg-canvas">
                  Checked by AnyTrade {formatDate(tradie.verified_at)}
                </Stamp>
              </div>
            ) : null}
          </Panel>

          <Panel className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">Coverage</h2>
            {tradie.service_areas.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tradie.service_areas.map((area) => (
                  <Link
                    key={area}
                    href={`/find-a-tradie?suburb=${encodeURIComponent(area)}`}
                    className="border-2 border-ink bg-canvas-deep px-2 py-0.5 text-xs hover:bg-safety"
                  >
                    {area}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-mute">No service areas listed.</p>
            )}
            <dl className="mt-4 space-y-2 border-t-2 border-dashed border-ink/25 pt-4 text-sm">
              <Row label="Available now" value={tradie.available_now ? 'Yes' : 'Booked up'} />
              <Row label="Weekends" value={tradie.available_weekends ? 'Yes' : 'No'} />
              <Row
                label="Usual reply"
                value={tradie.response_time_mins ? `${tradie.response_time_mins} min` : '—'}
              />
            </dl>
          </Panel>

          <Panel tone="navy" className="p-5">
            <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
              How rating works here
            </h2>
            <p className="mt-2 text-sm text-canvas/85">
              After a job is signed off, both sides rate each other out of five — the same way a
              rideshare app does it. Tradies are scored on:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-canvas/85">
              {RATING_CRITERIA.map((c) => (
                <li key={c.key}>· {c.label}</li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="font-sign text-[11px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">{label}</p>
      <p className="font-display text-2xl leading-tight text-ink">{value}</p>
    </div>
  )
}
