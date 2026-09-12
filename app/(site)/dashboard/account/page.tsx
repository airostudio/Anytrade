import { auth } from '@/lib/auth'
import { Panel } from '@/components/ui'
import Stars from '@/components/Stars'
import { getUser } from '@/lib/repos/users'
import { reviewsForUser } from '@/lib/repos/reviews'
import { formatDate, rating1dp, timeAgo } from '@/lib/utils'
import AccountForms from './AccountForms'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) return null

  const [me, reviews] = await Promise.all([
    getUser(session.user.id),
    reviewsForUser(session.user.id, 10),
  ])
  if (!me) return null

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <Panel className="p-7">
          <h2 className="mb-5 border-b-[3px] border-safety pb-2 font-sign text-xl font-bold uppercase tracking-wide">
            Your details
          </h2>
          <AccountForms
            defaults={{
              name: me.name,
              phone: me.phone ?? '',
              suburb: me.suburb ?? '',
              state: me.state ?? '',
              postcode: me.postcode ?? '',
            }}
          />
        </Panel>
      </div>

      <aside className="space-y-5">
        <Panel tone="navy" className="p-6">
          <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
            Your customer rating
          </h2>
          <p className="mt-3 font-display text-5xl leading-none">
            {me.client_review_count ? rating1dp(me.client_rating) : '—'}
          </p>
          <Stars value={me.client_rating} className="mt-2" />
          <p className="mt-2 text-sm text-canvas/80">
            {me.client_review_count
              ? `From ${me.client_review_count} tradie${me.client_review_count === 1 ? '' : 's'} you have hired.`
              : 'Tradies rate you after each finished job — same as you rate them.'}
          </p>
        </Panel>

        <Panel className="p-5">
          <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">Account</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-mute">Email</dt>
              <dd className="font-mono text-xs">{me.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-mute">Member since</dt>
              <dd>{formatDate(me.created_at)}</dd>
            </div>
          </dl>
        </Panel>

        {reviews.length ? (
          <Panel tone="manila" className="p-5">
            <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
              What tradies said
            </h2>
            <ul className="space-y-3">
              {reviews
                .filter((r) => r.direction === 'TRADIE_TO_CLIENT')
                .map((review) => (
                  <li key={review.id} className="border-b border-dashed border-ink/25 pb-3 last:border-0">
                    <Stars value={review.rating} size="sm" />
                    {review.comment ? (
                      <p className="mt-1 text-sm text-ink-soft">“{review.comment}”</p>
                    ) : null}
                    <p className="mt-1 text-xs text-ink-mute">
                      {review.reviewer_name} · {timeAgo(review.created_at)}
                    </p>
                  </li>
                ))}
            </ul>
          </Panel>
        ) : null}
      </aside>
    </div>
  )
}
