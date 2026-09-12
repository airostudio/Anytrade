import Link from 'next/link'
import { auth } from '@/lib/auth'
import Stars from '@/components/Stars'
import { EmptyState, Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { ratingBreakdown, reviewsForTradie, topTags } from '@/lib/repos/reviews'
import { categoryName, RATING_CRITERIA } from '@/lib/constants'
import { rating1dp, timeAgo } from '@/lib/utils'
import ReplyForm from './ReplyForm'

export const dynamic = 'force-dynamic'

export default async function TradieReviewsPage() {
  const session = await auth()
  if (!session?.user) return null

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return null

  const [reviews, breakdown, tags] = await Promise.all([
    reviewsForTradie(tradie.id, 50),
    ratingBreakdown(tradie.id),
    topTags(tradie.id, 8),
  ])

  const subRatings = [
    { label: 'Quality', value: tradie.rating_quality },
    { label: 'Punctuality', value: tradie.rating_punctuality },
    { label: 'Value', value: tradie.rating_value },
    { label: 'Communication', value: tradie.rating_communication },
    { label: 'Tidiness', value: tradie.rating_tidiness },
  ]

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Your reputation"
        title="Ratings & reviews"
        blurb="Every review here comes from a customer with a completed job. You can reply publicly to any of them."
        action={
          <Link href={`/find-a-tradie/${tradie.slug}`} className="btn-ghost btn-sm">
            View public listing
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Overall"
          value={tradie.total_reviews ? rating1dp(tradie.average_rating) : '—'}
          hint={`${tradie.total_reviews} reviews`}
          tone="mustard"
        />
        <StatTile label="Jobs completed" value={tradie.completed_jobs} tone="bottle" />
        <StatTile label="Profile views" value={tradie.profile_views} tone="navy" />
        <StatTile
          label="5-star reviews"
          value={breakdown[5] ?? 0}
          hint={
            tradie.total_reviews
              ? `${Math.round(((breakdown[5] ?? 0) / tradie.total_reviews) * 100)}% of the total`
              : undefined
          }
          tone="safety"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {reviews.length ? (
            reviews.map((review) => (
              <Panel key={review.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Stars value={review.rating} showValue />
                    <p className="mt-1 text-sm text-ink-mute">
                      {review.reviewer_name}
                      {review.reviewer_suburb ? ` · ${review.reviewer_suburb}` : ''} ·{' '}
                      {timeAgo(review.created_at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Pill className="border-ink bg-canvas-deep text-ink-soft">
                      {categoryName(review.job_category)}
                    </Pill>
                    {review.status !== 'PUBLISHED' ? (
                      <Pill className="border-oxide bg-oxide text-canvas">{review.status}</Pill>
                    ) : null}
                  </div>
                </div>

                <p className="mt-1 font-mono text-xs text-ink-mute">
                  {review.job_reference} — {review.job_title}
                </p>

                {review.comment ? <p className="mt-3 text-ink-soft">“{review.comment}”</p> : null}

                {review.tags.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {review.tags.map((tag) => (
                      <Pill key={tag} className="border-bottle bg-transparent text-bottle">
                        {tag}
                      </Pill>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 grid grid-cols-2 gap-2 border-t-2 border-dashed border-ink/25 pt-3 text-xs sm:grid-cols-5">
                  {RATING_CRITERIA.map((criterion) => {
                    const key = `rating_${criterion.key}` as keyof typeof review
                    const value = review[key] as number | null
                    return (
                      <div key={criterion.key}>
                        <p className="font-sign uppercase tracking-widest text-ink-mute">
                          {criterion.label}
                        </p>
                        <p className="font-bold">{value ? `${value}/5` : '—'}</p>
                      </div>
                    )
                  })}
                </div>

                {review.response ? (
                  <div className="mt-4 border-l-4 border-safety bg-canvas-deep p-3">
                    <p className="font-sign text-xs uppercase tracking-widest text-ink-mute">
                      Your reply
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{review.response}</p>
                  </div>
                ) : (
                  <div className="mt-4 border-t-2 border-dashed border-ink/25 pt-4">
                    <ReplyForm reviewId={review.id} />
                  </div>
                )}
              </Panel>
            ))
          ) : (
            <EmptyState
              icon="⭐"
              title="No reviews yet"
              blurb="Finish your first job through AnyTrade and the customer is prompted to rate you straight away."
              action={
                <Link href="/tradie/leads" className="btn-primary">
                  Find work
                </Link>
              }
            />
          )}
        </div>

        <aside className="space-y-5">
          <Panel className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
              Star breakdown
            </h2>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const n = breakdown[star] ?? 0
                const pct = tradie.total_reviews ? (n / tradie.total_reviews) * 100 : 0
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-7 font-mono text-ink-mute">{star}★</span>
                    <span className="h-3 flex-1 border-2 border-ink bg-canvas-deep">
                      <span className="block h-full bg-safety" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="w-6 text-right font-mono text-ink-mute">{n}</span>
                  </div>
                )
              })}
            </div>
          </Panel>

          <Panel tone="manila" className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
              Score by criterion
            </h2>
            <dl className="space-y-2 text-sm">
              {subRatings.map((item) => (
                <div key={item.label} className="flex items-baseline justify-between gap-3">
                  <dt className="text-ink-mute">{item.label}</dt>
                  <dd className="font-display text-lg">{rating1dp(item.value)}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          {tags.length ? (
            <Panel tone="navy" className="p-5">
              <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
                What people say most
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag.tag}
                    className="border-2 border-canvas/60 px-2 py-0.5 text-xs font-semibold"
                  >
                    {tag.tag} · {tag.n}
                  </span>
                ))}
              </div>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  )
}
