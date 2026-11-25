import Link from 'next/link'
import Stars from './Stars'
import { Pill, Stamp } from './ui'
import { categoryName } from '@/lib/constants'
import { money, initials, truncate } from '@/lib/utils'
import type { TradieProfile } from '@/lib/types'

export default function TradieCard({ tradie }: { tradie: TradieProfile }) {
  const verified = tradie.verification_status === 'VERIFIED'

  return (
    <article className="relative flex h-full flex-col border border-hairline bg-canvas shadow-hard card-lift rounded-2xl">
      {tradie.is_featured ? (
        <div className="absolute -right-2 -top-3 z-10">
          <Stamp tone="oxide" className="bg-canvas">
            Featured
          </Stamp>
        </div>
      ) : null}

      <div className="flex items-start gap-3 border-b border-ink/20 p-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-hairline bg-navy font-display text-xl text-canvas">
          {initials(tradie.business_name || tradie.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold leading-tight text-ink">
            <Link href={`/find-a-tradie/${tradie.slug}`} className="hover:text-oxide">
              {tradie.business_name}
            </Link>
          </h3>
          <p className="truncate text-sm text-ink-mute">
            {tradie.name}
            {tradie.base_suburb ? ` · ${tradie.base_suburb}` : ''}
          </p>
          <div className="mt-1.5">
            <Stars value={tradie.average_rating} size="sm" showValue count={tradie.total_reviews} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {tradie.tagline ? (
          <p className="text-sm italic text-ink-soft">“{truncate(tradie.tagline, 110)}”</p>
        ) : null}

        <div className="flex flex-wrap gap-1.5">
          {tradie.trades.slice(0, 3).map((trade) => (
            <Pill key={trade} className="border-hairline bg-canvas-deep text-ink">
              {categoryName(trade)}
            </Pill>
          ))}
          {tradie.trades.length > 3 ? (
            <Pill className="border-ink/40 bg-transparent text-ink-mute">
              +{tradie.trades.length - 3}
            </Pill>
          ) : null}
        </div>

        <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-dashed border-ink/25 pt-3 text-sm">
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-[0.12em] text-ink-mute">Hourly</dt>
            <dd className="font-bold text-ink">
              {tradie.hourly_rate ? `${money(tradie.hourly_rate)}/hr` : 'On quote'}
            </dd>
          </div>
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-[0.12em] text-ink-mute">Call-out</dt>
            <dd className="font-bold text-ink">
              {tradie.callout_fee ? money(tradie.callout_fee) : tradie.free_quotes ? 'Free quote' : '—'}
            </dd>
          </div>
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-[0.12em] text-ink-mute">Jobs done</dt>
            <dd className="font-bold text-ink">{tradie.completed_jobs}</dd>
          </div>
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-[0.12em] text-ink-mute">Experience</dt>
            <dd className="font-bold text-ink">
              {tradie.years_experience ? `${tradie.years_experience} yrs` : '—'}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-1.5">
          {verified ? (
            <Pill className="border-bottle bg-bottle text-canvas">✓ Licence checked</Pill>
          ) : null}
          {tradie.accepts_small_jobs ? (
            <Pill className="border-hairline bg-mustard text-ink">Small jobs OK</Pill>
          ) : null}
          {tradie.is_homegirl ? (
            <Pill className="border-oxide bg-oxide text-canvas">Homegirl</Pill>
          ) : null}
          {tradie.emergency_callouts ? (
            <Pill className="border-hairline bg-safety text-ink">24/7</Pill>
          ) : null}
        </div>

        <Link href={`/find-a-tradie/${tradie.slug}`} className="btn-navy btn-sm w-full">
          View profile &amp; reviews
        </Link>
      </div>
    </article>
  )
}
