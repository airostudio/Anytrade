import Link from 'next/link'
import { auth } from '@/lib/auth'
import JobCard from '@/components/JobCard'
import { EmptyState, Panel, SectionHeading } from '@/components/ui'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { leadsForTradie } from '@/lib/repos/jobs'
import { TRADE_CATEGORIES } from '@/lib/constants'
import { BID_CREDIT_COST } from '@/lib/constants'

export const dynamic = 'force-dynamic'

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; all?: string }
}) {
  const session = await auth()
  if (!session?.user) return null

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return null

  const leads = await leadsForTradie(tradie.id, {
    limit: 40,
    category: searchParams.category,
    q: searchParams.q,
    ignoreAreas: searchParams.all === '1',
  })

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="The job board"
        title="Leads in your trades"
        blurb="Only jobs you can actually quote on: your trades, your areas, still under the quote cap, and not already quoted by you."
      />

      <Panel className="p-4">
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
          <select name="category" defaultValue={searchParams.category ?? ''} className="field border-2 py-2">
            <option value="">All my trades</option>
            {TRADE_CATEGORIES.filter((c) => tradie.trades.includes(c.slug)).map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={searchParams.q ?? ''}
            placeholder="Search jobs or suburbs"
            className="field border-2 py-2"
          />
          <label className="flex items-center gap-2 border-2 border-ink bg-canvas px-3 text-sm">
            <input type="checkbox" name="all" value="1" defaultChecked={searchParams.all === '1'} className="h-4 w-4 accent-oxide" />
            Outside my areas
          </label>
          <button type="submit" className="btn-navy btn-sm">
            Filter
          </button>
        </form>
      </Panel>

      <Panel tone="manila" className="p-4">
        <p className="text-sm text-ink-soft">
          <strong className="font-sign uppercase tracking-wide">What a quote costs:</strong>{' '}
          {Object.entries(BID_CREDIT_COST)
            .map(([size, cost]) => `${size.replace(/_/g, ' ').toLowerCase()} ${cost}`)
            .join(' · ')}{' '}
          credit(s). You have <strong>{tradie.lead_credits}</strong>.
        </p>
      </Panel>

      {leads.length ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {leads.map((job) => (
            <JobCard key={job.id} job={job} href={`/tradie/leads/${job.id}`} cta="View &amp; quote" />
          ))}
        </div>
      ) : (
        <EmptyState
          icon="📡"
          title="Nothing matching right now"
          blurb="Try clearing the filters, ticking 'outside my areas', or adding more trades to your listing."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/tradie/leads?all=1" className="btn-primary">
                Show jobs outside my areas
              </Link>
              <Link href="/tradie/profile" className="btn-ghost">
                Edit my trades
              </Link>
            </div>
          }
        />
      )}
    </div>
  )
}
