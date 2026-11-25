'use client'

import Link from 'next/link'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ArrowRight, Search, X } from 'lucide-react'
import { TRADE_CATEGORIES } from '@/lib/constants'
import { aud } from '@/lib/price-guide'
import { IconTile, btnSecondary, fieldCls } from './ui'
import { POPULAR_TRADE_SLUGS, tradeIcon } from './trade-icons'
import { usePostJob } from './PostJobProvider'

const POPULAR = POPULAR_TRADE_SLUGS.map((slug) => TRADE_CATEGORIES.find((c) => c.slug === slug)!).filter(Boolean)

/** Top 8 trades as a 4x2 grid, plus a drawer so nobody hits a dead end. */
export default function TradeGrid() {
  const [drawer, setDrawer] = useState(false)

  return (
    <>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POPULAR.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/trades/${c.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-hairline bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-charcoal/25 hover:shadow-lift"
            >
              <IconTile icon={tradeIcon(c.slug)} size="lg" />
              <h3 className="mt-4 text-lg font-bold text-charcoal">{c.name}</h3>
              <p className="mt-1.5 line-clamp-2 flex-1 text-[15px] leading-relaxed text-charcoal-mute">
                {c.blurb}
              </p>
              <p className="mt-4 flex items-center justify-between border-t border-hairline pt-3 text-sm font-semibold">
                <span className="text-charcoal-mute">
                  From <span className="text-charcoal">{aud(c.typicalFrom)}</span>
                </span>
                <ArrowRight
                  className="h-4 w-4 text-terracotta-deep transition group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex justify-center">
        <button type="button" className={btnSecondary} onClick={() => setDrawer(true)}>
          View all {TRADE_CATEGORIES.length} trades
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {drawer ? <AllTradesDrawer onClose={() => setDrawer(false)} /> : null}
    </>
  )
}

function AllTradesDrawer({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { open } = usePostJob()
  const titleId = useId()
  const [q, setQ] = useState('')
  const [smallOnly, setSmallOnly] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
    }
  }, [])

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return TRADE_CATEGORIES.filter((c) => {
      if (smallOnly && !c.handyman) return false
      if (!needle) return true
      return (
        c.name.toLowerCase().includes(needle) ||
        c.blurb.toLowerCase().includes(needle) ||
        c.common.some((x) => x.toLowerCase().includes(needle))
      )
    })
  }, [q, smallOnly])

  function quote(slug: string) {
    dialogRef.current?.close()
    // Wait for this dialog to leave the top layer before opening the next one.
    setTimeout(() => open({ category: slug }), 0)
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close()
      }}
      className="m-0 ml-auto h-full max-h-none w-full max-w-md border-0 bg-white p-0 text-charcoal shadow-lift backdrop:bg-charcoal/50 open:animate-drawer-in"
    >
      <div className="flex h-full flex-col">
        <header className="border-b border-hairline px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id={titleId} className="font-heritage text-2xl font-semibold tracking-tight">
                All {TRADE_CATEGORIES.length} trades
              </h2>
              <p className="mt-1 text-[15px] text-charcoal-mute">Find the right tradie for the job.</p>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Close trade list"
              className="-mr-2 rounded-lg p-2 text-charcoal-mute transition hover:bg-charcoal/5 hover:text-charcoal"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="relative mt-4">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-mute"
              aria-hidden="true"
            />
            <label htmlFor="trade-filter" className="sr-only">
              Filter trades
            </label>
            <input
              id="trade-filter"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search trades or jobs, e.g. tap, deck"
              className={`${fieldCls} !pl-10`}
            />
          </div>

          <div className="mt-3 flex gap-2" role="group" aria-label="Filter by job size">
            {[
              { label: 'All trades', value: false },
              { label: 'Small-job friendly', value: true },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                aria-pressed={smallOnly === chip.value}
                onClick={() => setSmallOnly(chip.value)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition ${
                  smallOnly === chip.value
                    ? 'border-charcoal bg-charcoal text-white'
                    : 'border-charcoal/20 text-charcoal hover:border-charcoal/50'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2" aria-live="polite">
          <p className="sr-only">{results.length} trades shown</p>
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-semibold">No trade matches &ldquo;{q}&rdquo;</p>
              <p className="mt-1 text-[15px] text-charcoal-mute">
                Not sure which trade you need? A Home Handyman can take most small jobs.
              </p>
              <button type="button" className={`${btnSecondary} mt-4`} onClick={() => quote('handyman')}>
                Get Home Handyman quotes
              </button>
            </div>
          ) : (
            <ul>
              {results.map((c) => {
                const Icon = tradeIcon(c.slug)
                return (
                  <li key={c.slug} className="flex items-center gap-1 rounded-xl hover:bg-alabaster">
                    <Link
                      href={`/trades/${c.slug}`}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-3"
                    >
                      <IconTile icon={Icon} size="sm" />
                      <span className="min-w-0">
                        <span className="block font-semibold">{c.name}</span>
                        <span className="block truncate text-sm text-charcoal-mute">
                          From {aud(c.typicalFrom)} · {c.common.slice(0, 2).join(', ')}
                        </span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => quote(c.slug)}
                      className="mr-2 shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-terracotta-deep transition hover:bg-terracotta-tint"
                    >
                      Get quotes
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  )
}
