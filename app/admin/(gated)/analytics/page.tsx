import { Panel, SectionHeading, StatTile } from '@/components/ui'
import {
  jobsByCategory,
  jobsByMonth,
  platformStats,
  signupsByMonth,
  topSuburbs,
  topTradies,
} from '@/lib/repos/admin'
import { revenueByMonth, revenueSummary } from '@/lib/repos/payments'
import { countsByTrade, topServiceAreas } from '@/lib/repos/tradies'
import { categoryName } from '@/lib/constants'
import { money, rating1dp } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const [stats, revenue, revMonths, jobMonths, signups, categories, suburbs, areas, tradieCounts, tops] =
    await Promise.all([
      platformStats(),
      revenueSummary(),
      revenueByMonth(12),
      jobsByMonth(12),
      signupsByMonth(12),
      jobsByCategory(),
      topSuburbs(12),
      topServiceAreas(12),
      countsByTrade(),
      topTradies(10),
    ])

  const completionRate = stats.jobs.total
    ? Math.round((stats.jobs.completed / stats.jobs.total) * 100)
    : 0
  const awardRate = stats.jobs.total
    ? Math.round(((stats.jobs.completed + stats.jobs.awarded + stats.jobs.inProgress) / stats.jobs.total) * 100)
    : 0
  const bidWinRate = stats.bids.total ? Math.round((stats.bids.accepted / stats.bids.total) * 100) : 0
  const verifiedShare = stats.users.tradies
    ? Math.round((stats.tradies.verified / stats.users.tradies) * 100)
    : 0

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Numbers"
        title="Analytics"
        blurb="Marketplace health at a glance — liquidity, conversion and where the work is."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Job completion rate"
          value={`${completionRate}%`}
          hint={`${stats.jobs.completed} of ${stats.jobs.total}`}
          tone="bottle"
        />
        <StatTile label="Jobs awarded" value={`${awardRate}%`} hint="Hired at least one tradie" tone="navy" />
        <StatTile
          label="Quote win rate"
          value={`${bidWinRate}%`}
          hint={`${stats.bids.avgPerJob.toFixed(1)} quotes per job`}
          tone="safety"
        />
        <StatTile
          label="Verified tradies"
          value={`${verifiedShare}%`}
          hint={`${stats.tradies.verified} of ${stats.users.tradies}`}
          tone="mustard"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Chart
          title="Revenue by month"
          rows={revMonths.map((m) => ({ label: m.month, value: Number(m.gross) }))}
          format={(v) => money(v)}
        />
        <Chart
          title="Jobs posted by month"
          rows={jobMonths.map((m) => ({ label: m.month, value: Number(m.posted) }))}
          format={(v) => String(v)}
          tone="bg-bottle"
        />
        <Chart
          title="Tradie sign-ups by month"
          rows={signups.map((m) => ({ label: m.month, value: Number(m.tradies) }))}
          format={(v) => String(v)}
          tone="bg-navy"
        />
        <Chart
          title="Homeowner sign-ups by month"
          rows={signups.map((m) => ({ label: m.month, value: Number(m.clients) }))}
          format={(v) => String(v)}
          tone="bg-oxide"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
            Demand by trade
          </h2>
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-2.5">Trade</th>
                  <th className="px-3 py-2.5 text-right">Jobs</th>
                  <th className="px-3 py-2.5 text-right">Tradies</th>
                  <th className="px-3 py-2.5 text-right">Avg quote</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((row) => (
                  <tr key={row.category} className="border-b border-dashed border-ink/20">
                    <td className="px-3 py-2.5">{categoryName(row.category)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{row.n}</td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {tradieCounts[row.category] ?? 0}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {row.avg_bid ? money(row.avg_bid) : '—'}
                    </td>
                  </tr>
                ))}
                {!categories.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-ink-mute">
                      No data yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Panel>
        </section>

        <section>
          <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
            Busiest suburbs
          </h2>
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[380px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-2.5">Suburb</th>
                  <th className="px-3 py-2.5 text-right">Jobs</th>
                  <th className="px-3 py-2.5 text-right">Tradies covering</th>
                </tr>
              </thead>
              <tbody>
                {suburbs.map((row) => (
                  <tr key={`${row.suburb}-${row.state}`} className="border-b border-dashed border-ink/20">
                    <td className="px-3 py-2.5">
                      {row.suburb}, {row.state}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{row.n}</td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      {areas.find((a) => a.suburb === row.suburb)?.count ?? 0}
                    </td>
                  </tr>
                ))}
                {!suburbs.length ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-8 text-center text-ink-mute">
                      No data yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Panel>
        </section>
      </div>

      <section>
        <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
          Revenue mix
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Lead credits" value={money(revenue.creditRevenue)} tone="safety" />
          <StatTile label="Memberships (30d)" value={money(revenue.subscriptionMrr)} tone="navy" />
          <StatTile label="Escrow fees" value={money(revenue.feesAllTime)} tone="bottle" />
          <StatTile label="Currently held" value={money(revenue.heldInEscrow)} tone="mustard" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
          Top performers
        </h2>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
              <tr>
                <th className="px-3 py-2.5">Business</th>
                <th className="px-3 py-2.5 text-right">Jobs done</th>
                <th className="px-3 py-2.5 text-right">Quotes won</th>
                <th className="px-3 py-2.5 text-right">Rating</th>
                <th className="px-3 py-2.5 text-right">Reviews</th>
                <th className="px-3 py-2.5">Plan</th>
              </tr>
            </thead>
            <tbody>
              {tops.map((tradie) => (
                <tr key={tradie.id} className="border-b border-dashed border-ink/20">
                  <td className="px-3 py-2.5 font-semibold">{tradie.business_name}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{tradie.completed_jobs}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{tradie.won_bids}</td>
                  <td className="px-3 py-2.5 text-right font-mono">
                    {rating1dp(tradie.average_rating)}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono">{tradie.total_reviews}</td>
                  <td className="px-3 py-2.5 text-ink-mute">{tradie.membership_tier}</td>
                </tr>
              ))}
              {!tops.length ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-ink-mute">
                    No tradies yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </Panel>
      </section>
    </div>
  )
}

function Chart({
  title,
  rows,
  format,
  tone = 'bg-safety',
}: {
  title: string
  rows: { label: string; value: number }[]
  format: (value: number) => string
  tone?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))

  return (
    <Panel className="p-5">
      <h3 className="mb-4 font-sign text-sm font-bold uppercase tracking-[0.2em]">{title}</h3>
      {rows.length ? (
        <div className="flex items-end gap-2 overflow-x-auto">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-[48px] flex-1 flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] text-ink-mute">{format(row.value)}</span>
              <div
                className={`w-full border-2 border-ink ${tone}`}
                style={{ height: `${Math.max(4, (row.value / max) * 130)}px` }}
              />
              <span className="whitespace-nowrap font-sign text-[10px] uppercase tracking-wider text-ink-mute">
                {row.label}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-ink-mute">No data for this period yet.</p>
      )}
    </Panel>
  )
}
