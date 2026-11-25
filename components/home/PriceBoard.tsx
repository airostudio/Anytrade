'use client'

import { useId, useRef, useState } from 'react'
import { ArrowRight, ReceiptText } from 'lucide-react'
import { PRICE_GUIDE, range } from '@/lib/price-guide'
import { getCategory } from '@/lib/constants'
import { IconTile, btnPrimary } from './ui'
import { tradeIcon } from './trade-icons'
import { usePostJob } from './PostJobProvider'

/** "What a small job usually costs": tabbed, itemised, GST-inclusive. */
export default function PriceBoard() {
  const { open } = usePostJob()
  const [active, setActive] = useState(0)
  const baseId = useId()
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const guide = PRICE_GUIDE[active]
  const category = getCategory(guide.slug)

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    const last = PRICE_GUIDE.length - 1
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1) : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : null
    if (next === null) return
    e.preventDefault()
    setActive(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-white shadow-card">
      <div className="flex flex-col gap-4 border-b border-hairline p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div role="tablist" aria-label="Trade price guides" className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {PRICE_GUIDE.map((g, i) => {
            const Icon = tradeIcon(g.slug)
            const selected = i === active
            return (
              <button
                key={g.slug}
                ref={(el) => {
                  tabRefs.current[i] = el
                }}
                role="tab"
                id={`${baseId}-tab-${i}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-semibold transition ${
                  selected ? 'bg-charcoal text-white' : 'text-charcoal hover:bg-charcoal/5'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {g.label}
              </button>
            )
          })}
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-verified-tint px-3.5 py-1.5 text-sm font-semibold text-verified-deep sm:self-auto">
          <ReceiptText className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          GST Included • Upfront Quotes
        </span>
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className="grid gap-0 lg:grid-cols-[1fr_20rem]"
      >
        <ul className="divide-y divide-hairline">
          {guide.lines.map((line) => (
            <li key={line.job} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
              <div className="min-w-0">
                <p className="font-semibold text-charcoal">{line.job}</p>
                {line.note ? <p className="mt-0.5 text-sm text-charcoal-mute">{line.note}</p> : null}
              </div>
              <p className="shrink-0 text-right font-heritage text-lg font-semibold tabular-nums text-charcoal">
                {range(line.from, line.to)}
              </p>
            </li>
          ))}
        </ul>

        <div className="flex flex-col justify-between gap-6 border-t border-hairline bg-alabaster p-6 lg:border-l lg:border-t-0">
          <div>
            <IconTile icon={tradeIcon(guide.slug)} />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-charcoal-mute">
              Typical {guide.label.toLowerCase()} job
            </p>
            <p className="mt-1 font-heritage text-4xl font-semibold tracking-tight tabular-nums">
              {category ? range(category.typicalFrom, category.typicalTo) : ''}
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-charcoal-mute">
              Quotes are itemised, include GST and are agreed before anyone picks up a tool. No call-out
              surprises.
            </p>
          </div>
          <button
            type="button"
            className={`${btnPrimary} w-full`}
            onClick={() => open({ category: guide.slug })}
          >
            Get {guide.label} quotes
            <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p className="border-t border-hairline px-5 py-3 text-sm text-charcoal-mute sm:px-6">
        Guide prices for typical small jobs in metro areas. Regional, after-hours and difficult-access
        jobs can cost more, and every quote shows its own breakdown.
      </p>
    </div>
  )
}
