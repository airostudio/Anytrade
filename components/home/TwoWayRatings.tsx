import { Clock, HandCoins, Home, KeyRound, MessageSquareText, Scale, Sparkles, Wrench } from 'lucide-react'
import { IconTile } from './ui'

interface Criterion {
  label: string
  score: number
  icon: typeof Clock
}

const OF_TRADIE: Criterion[] = [
  { label: 'Punctuality', score: 5, icon: Clock },
  { label: 'Clean & Tidy', score: 5, icon: Sparkles },
  { label: 'Fair Price', score: 4.5, icon: Scale },
]

const OF_HOMEOWNER: Criterion[] = [
  { label: 'Clear brief', score: 5, icon: MessageSquareText },
  { label: 'Easy access', score: 5, icon: KeyRound },
  { label: 'Paid promptly', score: 5, icon: HandCoins },
]

function Bars({ items }: { items: Criterion[] }) {
  return (
    <ul className="mt-5 space-y-4">
      {items.map(({ label, score, icon: Icon }) => (
        <li key={label}>
          <div className="flex items-center justify-between text-[15px]">
            <span className="flex items-center gap-2 font-semibold">
              <Icon className="h-4 w-4 text-charcoal-mute" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </span>
            <span className="font-semibold tabular-nums">{score.toFixed(1)}</span>
          </div>
          <div
            role="img"
            aria-label={`${label}: ${score} out of 5`}
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-charcoal/10"
          >
            <div className="h-full rounded-full bg-charcoal" style={{ width: `${(score / 5) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Mutual ratings: both sides of a completed job are rated. */
export default function TwoWayRatings() {
  return (
    <div className="flex h-full flex-col rounded-3xl border border-hairline bg-white p-6 shadow-card sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-terracotta-deep">
        Two-way accountability
      </p>
      <h2 className="mt-2 font-heritage text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
        Fair on both sides of the job.
      </h2>
      <p className="mt-3 text-lg leading-relaxed text-charcoal-mute">
        Once a job is done, the homeowner rates the tradie and the tradie rates the homeowner. Ratings only
        come from verified, completed jobs, so they mean something.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <section aria-labelledby="rate-tradie" className="rounded-2xl border border-hairline bg-alabaster p-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Wrench} size="sm" tone="charcoal" />
            <h3 id="rate-tradie" className="font-bold leading-tight">
              Homeowner rates the tradie
            </h3>
          </div>
          <Bars items={OF_TRADIE} />
        </section>
        <section aria-labelledby="rate-owner" className="rounded-2xl border border-hairline bg-alabaster p-5">
          <div className="flex items-center gap-3">
            <IconTile icon={Home} size="sm" tone="charcoal" />
            <h3 id="rate-owner" className="font-bold leading-tight">
              Tradie rates the homeowner
            </h3>
          </div>
          <Bars items={OF_HOMEOWNER} />
        </section>
      </div>
      <p className="mt-auto pt-5 text-sm text-charcoal-mute">
        Illustration of how a rating card looks once a job is completed.
      </p>
    </div>
  )
}
