import Link from 'next/link'
import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import Stars from '@/components/Stars'
import { listAllReviews } from '@/lib/repos/reviews'
import { platformStats } from '@/lib/repos/admin'
import { adminModerateReview, adminRecalcRatings } from '@/app/actions/admin'
import { categoryName } from '@/lib/constants'
import { rating1dp, timeAgo } from '@/lib/utils'
import type { ReviewStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUSES: ReviewStatus[] = ['PUBLISHED', 'PENDING_MODERATION', 'HIDDEN']

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: { status?: string; flagged?: string; direction?: string }
}) {
  const [all, stats] = await Promise.all([listAllReviews(300), platformStats()])

  let reviews = all
  if (searchParams.status) reviews = reviews.filter((r) => r.status === searchParams.status)
  if (searchParams.flagged === '1') reviews = reviews.filter((r) => r.is_flagged)
  if (searchParams.direction) reviews = reviews.filter((r) => r.direction === searchParams.direction)

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Trust & safety"
        title="Reviews"
        blurb="Both directions of the rating system. Hiding a review recalculates the affected average straight away."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="All reviews" value={stats.reviews.total} />
        <StatTile label="Published" value={stats.reviews.published} tone="bottle" />
        <StatTile
          label="Awaiting moderation"
          value={stats.reviews.pending}
          tone={stats.reviews.pending ? 'oxide' : 'canvas'}
        />
        <StatTile
          label="Flagged"
          value={stats.reviews.flagged}
          tone={stats.reviews.flagged ? 'oxide' : 'canvas'}
        />
        <StatTile label="Average rating" value={rating1dp(stats.reviews.avgRating)} tone="mustard" />
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/reviews"
            className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
              !searchParams.status && !searchParams.flagged && !searchParams.direction
                ? 'bg-safety'
                : 'bg-canvas'
            }`}
          >
            All ({all.length})
          </Link>
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/reviews?status=${status}`}
              className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
                searchParams.status === status ? 'bg-safety' : 'bg-canvas'
              }`}
            >
              {status.replace(/_/g, ' ')} ({all.filter((r) => r.status === status).length})
            </Link>
          ))}
          <Link
            href="/admin/reviews?flagged=1"
            className={`btn-sm border-2 border-oxide font-sign uppercase tracking-widest ${
              searchParams.flagged === '1' ? 'bg-oxide text-canvas' : 'bg-canvas text-oxide'
            }`}
          >
            Flagged ({all.filter((r) => r.is_flagged).length})
          </Link>
          <Link
            href="/admin/reviews?direction=CLIENT_TO_TRADIE"
            className={`btn-sm border-2 border-ink/40 font-sign uppercase tracking-widest ${
              searchParams.direction === 'CLIENT_TO_TRADIE' ? 'bg-mustard' : 'bg-canvas'
            }`}
          >
            Of tradies
          </Link>
          <Link
            href="/admin/reviews?direction=TRADIE_TO_CLIENT"
            className={`btn-sm border-2 border-ink/40 font-sign uppercase tracking-widest ${
              searchParams.direction === 'TRADIE_TO_CLIENT' ? 'bg-mustard' : 'bg-canvas'
            }`}
          >
            Of customers
          </Link>
        </div>
      </Panel>

      <div className="space-y-4">
        {reviews.map((review) => (
          <Panel key={review.id} className="p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={review.rating} showValue />
                  <Pill
                    className={
                      review.direction === 'CLIENT_TO_TRADIE'
                        ? 'border-ink bg-canvas-deep text-ink-soft'
                        : 'border-navy bg-navy text-canvas'
                    }
                  >
                    {review.direction === 'CLIENT_TO_TRADIE' ? 'Customer → tradie' : 'Tradie → customer'}
                  </Pill>
                  <Pill
                    className={
                      review.status === 'PUBLISHED'
                        ? 'border-bottle bg-bottle text-canvas'
                        : review.status === 'HIDDEN'
                          ? 'border-oxide bg-oxide text-canvas'
                          : 'border-ink bg-mustard text-ink'
                    }
                  >
                    {review.status.replace(/_/g, ' ')}
                  </Pill>
                  {review.is_flagged ? (
                    <Pill className="border-oxide bg-canvas text-oxide">⚑ Flagged</Pill>
                  ) : null}
                </div>

                <p className="mt-2 text-sm text-ink-mute">
                  <strong>{review.reviewer_name}</strong> → <strong>{review.reviewee_name}</strong>
                  {review.business_name ? ` (${review.business_name})` : ''} ·{' '}
                  {timeAgo(review.created_at)}
                </p>
                <p className="font-mono text-xs text-ink-mute">
                  {review.job_reference} — {review.job_title} · {categoryName(review.job_category)}
                </p>

                {review.comment ? (
                  <p className="mt-3 border-l-4 border-ink/25 pl-3 text-ink-soft">“{review.comment}”</p>
                ) : (
                  <p className="mt-3 text-sm italic text-ink-mute">No written comment.</p>
                )}

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
                  <div className="mt-3 border-l-4 border-safety bg-canvas-deep p-3">
                    <p className="font-sign text-xs uppercase tracking-widest text-ink-mute">
                      Tradie reply
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">{review.response}</p>
                  </div>
                ) : null}

                {review.flag_reason ? (
                  <p className="mt-3 text-sm text-oxide">
                    <strong>Flag reason:</strong> {review.flag_reason}
                  </p>
                ) : null}
                {review.moderator_note ? (
                  <p className="mt-1 text-sm text-ink-mute">
                    <strong>Moderator note:</strong> {review.moderator_note}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 border-t-2 border-dashed border-ink/25 pt-4 lg:border-l-2 lg:border-t-0 lg:pl-5 lg:pt-0">
                <form action={adminModerateReview} className="space-y-2">
                  <input type="hidden" name="reviewId" value={review.id} />
                  <label className="label mb-0">Moderation</label>
                  <select
                    name="status"
                    defaultValue={review.status}
                    className="field border-2 py-1.5 text-sm"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  <input
                    name="note"
                    defaultValue={review.moderator_note ?? ''}
                    placeholder="Internal note"
                    className="field border-2 py-1.5 text-sm"
                  />
                  <button type="submit" className="btn-navy btn-sm w-full">
                    Apply
                  </button>
                </form>

                {review.tradesperson_id ? (
                  <form action={adminRecalcRatings}>
                    <input type="hidden" name="tradespersonId" value={review.tradesperson_id} />
                    <button type="submit" className="btn-ghost btn-sm w-full">
                      Recalculate their average
                    </button>
                  </form>
                ) : null}

                {review.slug ? (
                  <Link href={`/find-a-tradie/${review.slug}`} className="btn-ghost btn-sm w-full">
                    View listing
                  </Link>
                ) : null}
              </div>
            </div>
          </Panel>
        ))}

        {!reviews.length ? (
          <Panel className="p-10 text-center text-ink-mute">No reviews match that filter.</Panel>
        ) : null}
      </div>
    </div>
  )
}
