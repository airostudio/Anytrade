import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { listAllBids } from '@/lib/repos/bids'
import { platformStats } from '@/lib/repos/admin'
import { categoryName } from '@/lib/constants'
import { BID_STATUS_LABEL, bidStatusTone, money, timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminBidsPage() {
  const [bids, stats] = await Promise.all([listAllBids(300), platformStats()])

  const totalValue = bids.reduce((sum, b) => sum + b.amount, 0)
  const wonValue = bids.filter((b) => b.status === 'ACCEPTED').reduce((sum, b) => sum + b.amount, 0)
  const creditsSpent = bids.reduce((sum, b) => sum + b.credits_spent, 0)

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="The bidding board"
        title="Quotes"
        blurb="Every quote submitted, what it was worth, and whether it won."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Total quotes" value={stats.bids.total} />
        <StatTile label="Accepted" value={stats.bids.accepted} tone="bottle" />
        <StatTile label="Avg per job" value={stats.bids.avgPerJob.toFixed(1)} tone="navy" />
        <StatTile label="Quoted value" value={money(totalValue)} tone="mustard" />
        <StatTile label="Won value" value={money(wonValue)} tone="safety" />
      </div>

      <Panel tone="manila" className="p-4">
        <p className="text-sm text-ink-soft">
          <strong className="font-sign uppercase tracking-wide">{creditsSpent}</strong> lead credits
          have been spent submitting these quotes. Average quote is{' '}
          <strong>{money(stats.bids.avgAmount)}</strong>.
        </p>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">Job ref</th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Tradie</th>
              <th className="px-4 py-3">Trade</th>
              <th className="px-4 py-3 text-right">Quote</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((bid) => (
              <tr key={bid.id} className="border-b border-dashed border-ink/20">
                <td className="px-4 py-3 font-mono text-xs">{bid.job_reference}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{bid.job_title}</span>
                  <span className="block text-xs text-ink-mute">{bid.job_suburb}</span>
                </td>
                <td className="px-4 py-3">{bid.business_name}</td>
                <td className="px-4 py-3 text-ink-soft">{categoryName(bid.job_category)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold">{money(bid.amount)}</td>
                <td className="px-4 py-3 text-right font-mono text-ink-mute">
                  {bid.job_budget_max ? money(bid.job_budget_max) : '—'}
                </td>
                <td className="px-4 py-3 font-mono">{bid.credits_spent}</td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-mute">{timeAgo(bid.created_at)}</td>
                <td className="px-4 py-3">
                  <Pill className={bidStatusTone(bid.status)}>{BID_STATUS_LABEL[bid.status]}</Pill>
                </td>
              </tr>
            ))}
            {!bids.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-ink-mute">
                  No quotes submitted yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
