import Link from 'next/link'
import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import Stars from '@/components/Stars'
import { listAllTradies } from '@/lib/repos/tradies'
import { platformStats } from '@/lib/repos/admin'
import {
  adminAdjustCredits,
  adminSetMembership,
  adminSetVerification,
  adminToggleFeatured,
} from '@/app/actions/admin'
import { categoryName } from '@/lib/constants'
import { formatDate, MEMBERSHIP_LABEL, money } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const TIERS = ['FREE', 'SUBBIE', 'GUVNOR', 'MASTER'] as const
const STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const

export default async function AdminTradiesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const [all, stats] = await Promise.all([listAllTradies(300), platformStats()])

  const tradies = searchParams.status
    ? all.filter((t) => t.verification_status === searchParams.status)
    : all

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Supply side"
        title="Tradies"
        blurb="Verify licences, adjust credits, manage memberships and featured placement."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Listed" value={stats.users.tradies} />
        <StatTile label="Verified" value={stats.tradies.verified} tone="bottle" />
        <StatTile
          label="Awaiting check"
          value={stats.tradies.pendingVerification}
          tone={stats.tradies.pendingVerification ? 'oxide' : 'canvas'}
        />
        <StatTile label="Paid plans" value={stats.tradies.paid} tone="safety" />
        <StatTile label="Homegirls" value={stats.tradies.homegirls} tone="mustard" />
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/tradies"
            className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
              !searchParams.status ? 'bg-safety' : 'bg-canvas'
            }`}
          >
            All ({all.length})
          </Link>
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/tradies?status=${status}`}
              className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
                searchParams.status === status ? 'bg-safety' : 'bg-canvas'
              }`}
            >
              {status} ({all.filter((t) => t.verification_status === status).length})
            </Link>
          ))}
        </div>
      </Panel>

      <div className="space-y-4">
        {tradies.map((tradie) => (
          <Panel key={tradie.id} className="p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-sign text-lg font-bold uppercase tracking-wide">
                    <Link href={`/find-a-tradie/${tradie.slug}`} className="hover:text-oxide">
                      {tradie.business_name}
                    </Link>
                  </h3>
                  <Pill
                    className={
                      tradie.verification_status === 'VERIFIED'
                        ? 'border-bottle bg-bottle text-canvas'
                        : tradie.verification_status === 'REJECTED'
                          ? 'border-oxide bg-oxide text-canvas'
                          : 'border-ink bg-canvas-deep text-ink-soft'
                    }
                  >
                    {tradie.verification_status}
                  </Pill>
                  <Pill className="border-ink bg-canvas-deep text-ink-soft">
                    {MEMBERSHIP_LABEL[tradie.membership_tier]}
                  </Pill>
                  {tradie.is_featured ? (
                    <Pill className="border-ink bg-safety text-ink">Featured</Pill>
                  ) : null}
                  {tradie.is_homegirl ? (
                    <Pill className="border-oxide bg-canvas text-oxide">Homegirl</Pill>
                  ) : null}
                  {tradie.is_suspended ? (
                    <Pill className="border-oxide bg-oxide text-canvas">Account suspended</Pill>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-ink-mute">
                  {tradie.name} · {tradie.email} · {tradie.base_suburb ?? '—'}, {tradie.state ?? '—'}
                </p>

                <div className="mt-2">
                  <Stars value={tradie.average_rating} size="sm" showValue count={tradie.total_reviews} />
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tradie.trades.map((trade) => (
                    <Pill key={trade} className="border-ink/40 bg-transparent text-ink-soft">
                      {categoryName(trade)}
                    </Pill>
                  ))}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-2 border-t-2 border-dashed border-ink/25 pt-3 text-sm sm:grid-cols-4">
                  <Fact label="Credits" value={String(tradie.lead_credits)} />
                  <Fact label="Jobs done" value={String(tradie.completed_jobs)} />
                  <Fact label="Quotes" value={`${tradie.won_bids}/${tradie.total_bids}`} />
                  <Fact label="Hourly" value={tradie.hourly_rate ? money(tradie.hourly_rate) : '—'} />
                  <Fact label="ABN" value={tradie.abn ?? '—'} />
                  <Fact label="Licence" value={tradie.licence_number ?? '—'} />
                  <Fact label="Insurer" value={tradie.insurer_name ?? '—'} />
                  <Fact label="Joined" value={formatDate(tradie.created_at)} />
                </dl>

                {tradie.verification_notes ? (
                  <p className="mt-3 border-l-4 border-mustard bg-canvas-deep px-3 py-2 text-sm">
                    <strong>Note:</strong> {tradie.verification_notes}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3 border-t-2 border-dashed border-ink/25 pt-4 lg:border-l-2 lg:border-t-0 lg:pl-5 lg:pt-0">
                <form action={adminSetVerification} className="space-y-2">
                  <input type="hidden" name="tradespersonId" value={tradie.id} />
                  <label className="label mb-0">Verification</label>
                  <select name="status" defaultValue={tradie.verification_status} className="field border-2 py-1.5 text-sm">
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <input
                    name="notes"
                    defaultValue={tradie.verification_notes ?? ''}
                    placeholder="Note to the tradie"
                    className="field border-2 py-1.5 text-sm"
                  />
                  <button type="submit" className="btn-navy btn-sm w-full">
                    Save verification
                  </button>
                </form>

                <form action={adminSetMembership} className="flex gap-2">
                  <input type="hidden" name="tradespersonId" value={tradie.id} />
                  <select name="tier" defaultValue={tradie.membership_tier} className="field border-2 py-1.5 text-sm">
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {MEMBERSHIP_LABEL[tier]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-ghost btn-sm whitespace-nowrap">
                    Set plan
                  </button>
                </form>

                <form action={adminAdjustCredits} className="flex gap-2">
                  <input type="hidden" name="tradespersonId" value={tradie.id} />
                  <input
                    name="delta"
                    type="number"
                    placeholder="± credits"
                    className="field border-2 py-1.5 text-sm"
                  />
                  <button type="submit" className="btn-ghost btn-sm whitespace-nowrap">
                    Adjust
                  </button>
                </form>

                <form action={adminToggleFeatured}>
                  <input type="hidden" name="tradespersonId" value={tradie.id} />
                  <input type="hidden" name="featured" value={String(!tradie.is_featured)} />
                  <button type="submit" className="btn-ghost btn-sm w-full">
                    {tradie.is_featured ? 'Remove featured' : 'Make featured'}
                  </button>
                </form>
              </div>
            </div>
          </Panel>
        ))}

        {!tradies.length ? (
          <Panel className="p-10 text-center text-ink-mute">No tradies match that filter.</Panel>
        ) : null}
      </div>
    </div>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="truncate font-semibold">{value}</dd>
    </div>
  )
}
