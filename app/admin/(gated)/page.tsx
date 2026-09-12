import Link from 'next/link'
import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { jobsByCategory, listAudit, listEnquiries, platformStats, topTradies } from '@/lib/repos/admin'
import { revenueSummary } from '@/lib/repos/payments'
import { listAllJobs } from '@/lib/repos/jobs'
import { listUsers } from '@/lib/repos/users'
import { homegirlsStats } from '@/lib/repos/homegirls'
import { isDatabaseReady } from '@/lib/db'
import { DatabaseNotice } from '@/components/ui'
import { categoryName } from '@/lib/constants'
import { JOB_STATUS_LABEL, jobStatusTone, money, rating1dp, timeAgo } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const ready = await isDatabaseReady()

  const [stats, revenue, recentJobs, recentUsers, categories, tops, audit, enquiries, homegirls] =
    await Promise.all([
      platformStats(),
      revenueSummary(),
      listAllJobs(8),
      listUsers({ limit: 8 }),
      jobsByCategory(),
      topTradies(8),
      listAudit(10),
      listEnquiries(5),
      homegirlsStats(),
    ])

  return (
    <div className="space-y-10">
      <SectionHeading
        eyebrow="Back office"
        title="Platform overview"
        blurb="Everything moving through AnyTrade right now."
      />

      {!ready ? <DatabaseNotice /> : null}

      {/* Money */}
      <section>
        <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
          Money
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Gross processed" value={money(revenue.grossAllTime)} tone="navy" />
          <StatTile label="Platform fees" value={money(revenue.feesAllTime)} tone="bottle" />
          <StatTile
            label="Held in escrow"
            value={money(revenue.heldInEscrow)}
            hint="Owed to tradies on sign-off"
            tone="mustard"
          />
          <StatTile
            label="Last 30 days"
            value={money(revenue.last30Gross)}
            hint={`${money(revenue.last30Fees)} in fees`}
            tone="safety"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <StatTile label="Membership revenue (30d)" value={money(revenue.subscriptionMrr)} />
          <StatTile label="Lead credit revenue" value={money(revenue.creditRevenue)} />
        </div>
      </section>

      {/* Marketplace */}
      <section>
        <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
          Marketplace
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Users"
            value={stats.users.total}
            hint={`${stats.users.clients} homeowners · ${stats.users.tradies} tradies`}
            href="/admin/users"
          />
          <StatTile
            label="Jobs"
            value={stats.jobs.total}
            hint={`${stats.jobs.open} open · ${stats.jobs.completed} completed`}
            href="/admin/jobs"
          />
          <StatTile
            label="Quotes"
            value={stats.bids.total}
            hint={`${stats.bids.avgPerJob.toFixed(1)} per job · avg ${money(stats.bids.avgAmount)}`}
            href="/admin/bids"
          />
          <StatTile
            label="Reviews"
            value={stats.reviews.total}
            hint={`Avg ${rating1dp(stats.reviews.avgRating)} stars`}
            href="/admin/reviews"
          />
        </div>
      </section>

      {/* Needs attention */}
      <section>
        <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
          Needs attention
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Verifications pending"
            value={stats.tradies.pendingVerification}
            tone={stats.tradies.pendingVerification ? 'oxide' : 'canvas'}
            href="/admin/tradies"
          />
          <StatTile
            label="Flagged reviews"
            value={stats.reviews.flagged + stats.reviews.pending}
            tone={stats.reviews.flagged ? 'oxide' : 'canvas'}
            href="/admin/reviews"
          />
          <StatTile
            label="Unhandled enquiries"
            value={stats.enquiries.unhandled}
            tone={stats.enquiries.unhandled ? 'oxide' : 'canvas'}
            href="/admin/enquiries"
          />
          <StatTile
            label="Homegirls applications"
            value={homegirls.pending}
            tone={homegirls.pending ? 'oxide' : 'canvas'}
            href="/admin/homegirls"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Recent jobs */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
              Latest jobs
            </h2>
            <Link href="/admin/jobs" className="text-sm underline underline-offset-4">
              All jobs
            </Link>
          </div>
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-2.5">Ref</th>
                  <th className="px-3 py-2.5">Job</th>
                  <th className="px-3 py-2.5">Quotes</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((job) => (
                  <tr key={job.id} className="border-b border-dashed border-ink/20">
                    <td className="px-3 py-2.5 font-mono text-xs">{job.reference}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-semibold">{job.title}</span>
                      <span className="block text-xs text-ink-mute">
                        {job.suburb} · {timeAgo(job.created_at)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-mono">{job.bid_count}</td>
                    <td className="px-3 py-2.5">
                      <Pill className={jobStatusTone(job.status)}>{JOB_STATUS_LABEL[job.status]}</Pill>
                    </td>
                  </tr>
                ))}
                {!recentJobs.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-ink-mute">
                      No jobs yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Panel>
        </section>

        {/* Recent users */}
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
              Newest sign-ups
            </h2>
            <Link href="/admin/users" className="text-sm underline underline-offset-4">
              All users
            </Link>
          </div>
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} className="border-b border-dashed border-ink/20">
                    <td className="px-3 py-2.5">
                      <span className="font-semibold">{user.name}</span>
                      <span className="block font-mono text-xs text-ink-mute">{user.email}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill className="border-ink bg-canvas-deep text-ink-soft">{user.role}</Pill>
                    </td>
                    <td className="px-3 py-2.5 text-ink-mute">{timeAgo(user.created_at)}</td>
                  </tr>
                ))}
                {!recentUsers.length ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-6 text-center text-ink-mute">
                      No users yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Panel>
        </section>

        {/* Categories */}
        <section>
          <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
            Jobs by trade
          </h2>
          <Panel className="p-4">
            {categories.length ? (
              <ul className="space-y-2">
                {categories.slice(0, 10).map((row) => {
                  const max = Math.max(...categories.map((c) => Number(c.n)))
                  const pct = max ? (Number(row.n) / max) * 100 : 0
                  return (
                    <li key={row.category} className="flex items-center gap-3 text-sm">
                      <span className="w-36 shrink-0 truncate">{categoryName(row.category)}</span>
                      <span className="h-3.5 flex-1 border-2 border-ink bg-canvas-deep">
                        <span className="block h-full bg-safety" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-10 text-right font-mono">{row.n}</span>
                      <span className="w-16 text-right font-mono text-ink-mute">
                        {row.avg_bid ? money(row.avg_bid) : '—'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="py-4 text-center text-ink-mute">No jobs yet.</p>
            )}
          </Panel>
        </section>

        {/* Top tradies */}
        <section>
          <h2 className="mb-3 font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
            Top tradies
          </h2>
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-3 py-2.5">Business</th>
                  <th className="px-3 py-2.5">Jobs</th>
                  <th className="px-3 py-2.5">Rating</th>
                  <th className="px-3 py-2.5">Plan</th>
                </tr>
              </thead>
              <tbody>
                {tops.map((tradie) => (
                  <tr key={tradie.id} className="border-b border-dashed border-ink/20">
                    <td className="px-3 py-2.5 font-semibold">
                      <Link href={`/find-a-tradie/${tradie.slug}`} className="hover:text-oxide">
                        {tradie.business_name}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 font-mono">{tradie.completed_jobs}</td>
                    <td className="px-3 py-2.5 font-mono">{rating1dp(tradie.average_rating)}</td>
                    <td className="px-3 py-2.5">
                      <Pill className="border-ink bg-canvas-deep text-ink-soft">
                        {tradie.membership_tier}
                      </Pill>
                    </td>
                  </tr>
                ))}
                {!tops.length ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-ink-mute">
                      No tradies yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Panel>
        </section>
      </div>

      {/* Audit + enquiries */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
              Recent activity
            </h2>
            <Link href="/admin/audit" className="text-sm underline underline-offset-4">
              Full log
            </Link>
          </div>
          <Panel className="divide-y-2 divide-dashed divide-ink/20">
            {audit.length ? (
              audit.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                  <div>
                    <span className="font-mono text-xs font-bold">{entry.action}</span>
                    {entry.detail ? (
                      <span className="block text-xs text-ink-mute">{entry.detail}</span>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-ink-mute">
                    {entry.actor_name ?? 'system'} · {timeAgo(entry.created_at)}
                  </span>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-ink-mute">Nothing logged yet.</p>
            )}
          </Panel>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-sign text-lg font-bold uppercase tracking-[0.2em] text-ink-mute">
              Latest enquiries
            </h2>
            <Link href="/admin/enquiries" className="text-sm underline underline-offset-4">
              All enquiries
            </Link>
          </div>
          <Panel className="divide-y-2 divide-dashed divide-ink/20">
            {enquiries.length ? (
              enquiries.map((enquiry) => (
                <div key={enquiry.id} className="p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{enquiry.name}</span>
                    {enquiry.is_handled ? (
                      <Pill className="border-bottle bg-bottle text-canvas">Handled</Pill>
                    ) : (
                      <Pill className="border-oxide bg-oxide text-canvas">New</Pill>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-mute">
                    {enquiry.subject ?? 'General'} · {timeAgo(enquiry.created_at)}
                  </p>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-ink-mute">No enquiries yet.</p>
            )}
          </Panel>
        </section>
      </div>
    </div>
  )
}
