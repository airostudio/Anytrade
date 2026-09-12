import Link from 'next/link'
import { auth } from '@/lib/auth'
import { EmptyState, Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { bidsForTradie } from '@/lib/repos/bids'
import { withdrawOwnBid } from '@/app/actions/bids'
import { BID_STATUS_LABEL, bidStatusTone, money, timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function MyBidsPage({ searchParams }: { searchParams: { quoted?: string } }) {
  const session = await auth()
  if (!session?.user) return null

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return null

  const bids = await bidsForTradie(tradie.id, 200)
  const live = bids.filter((b) => ['PENDING', 'SHORTLISTED'].includes(b.status))
  const won = bids.filter((b) => b.status === 'ACCEPTED')
  const lost = bids.filter((b) => ['DECLINED', 'WITHDRAWN', 'EXPIRED'].includes(b.status))
  const winRate = bids.length ? Math.round((won.length / bids.length) * 100) : 0
  const spent = bids.reduce((total, b) => total + b.credits_spent, 0)

  return (
    <div className="space-y-8">
      {searchParams.quoted ? (
        <Panel tone="mustard" className="p-4">
          <p className="font-sign font-bold uppercase tracking-wide">
            Quote sent. The customer gets a notification straight away.
          </p>
        </Panel>
      ) : null}

      <SectionHeading eyebrow="Your quotes" title="Every price you've put in" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Live quotes" value={live.length} tone="safety" />
        <StatTile label="Won" value={won.length} tone="bottle" />
        <StatTile label="Win rate" value={`${winRate}%`} tone="navy" />
        <StatTile label="Credits spent" value={spent} tone="mustard" />
      </div>

      {bids.length ? (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Suburb</th>
                <th className="px-4 py-3">My price</th>
                <th className="px-4 py-3">Customer budget</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {bids.map((bid) => (
                <tr key={bid.id} className="border-b border-dashed border-ink/20">
                  <td className="px-4 py-3 font-mono text-xs">{bid.job_reference}</td>
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/tradie/leads/${bid.job_id}`} className="hover:text-oxide">
                      {bid.job_title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{bid.job_suburb}</td>
                  <td className="px-4 py-3 font-mono font-bold">{money(bid.amount)}</td>
                  <td className="px-4 py-3 font-mono text-ink-mute">
                    {bid.job_budget_max ? money(bid.job_budget_max) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Pill className={bidStatusTone(bid.status)}>{BID_STATUS_LABEL[bid.status]}</Pill>
                    {bid.seen_by_client && bid.status === 'PENDING' ? (
                      <span className="ml-2 text-[11px] text-ink-mute">opened</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-ink-mute">{timeAgo(bid.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    {['PENDING', 'SHORTLISTED'].includes(bid.status) ? (
                      <form action={withdrawOwnBid}>
                        <input type="hidden" name="bidId" value={bid.id} />
                        <button
                          type="submit"
                          className="border-2 border-ink/30 px-2.5 py-1 font-sign text-[11px] font-bold uppercase tracking-widest text-ink-mute hover:border-oxide hover:text-oxide"
                        >
                          Withdraw
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : (
        <EmptyState
          icon="📝"
          title="No quotes yet"
          blurb="Find a job in your trades and put a price in. You only spend a credit when you submit."
          action={
            <Link href="/tradie/leads" className="btn-primary">
              Browse job leads
            </Link>
          }
        />
      )}

      {lost.length ? (
        <p className="text-sm text-ink-mute">
          {lost.length} quote{lost.length === 1 ? '' : 's'} did not go ahead. That is normal — a win
          rate around 20–30% is healthy on a bidding board.
        </p>
      ) : null}
    </div>
  )
}
