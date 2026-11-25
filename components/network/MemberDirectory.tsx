'use client'

import { useId, useMemo, useState } from 'react'
import { Check, MapPin, RotateCcw, SearchX } from 'lucide-react'
import {
  NO_FILTERS,
  SUBURB_SUGGESTIONS,
  TRADE_FILTERS,
  filterMembers,
  filtersActive,
  type MemberFilters,
  type NetworkMember,
} from '@/lib/homegirls-network'
import { usePostJob } from '@/components/home/PostJobProvider'
import { btnCopper } from '@/components/home/ui'
import { fieldHg } from './fields'
import MemberCard from './MemberCard'
import ProfileDrawer from './ProfileDrawer'
import QuoteModal from './QuoteModal'

type Open = { kind: 'quote' | 'profile'; member: NetworkMember } | null

export default function MemberDirectory({ members }: { members: NetworkMember[] }) {
  const { open: openPostJob } = usePostJob()
  const [filters, setFilters] = useState<MemberFilters>(NO_FILTERS)
  const [dialog, setDialog] = useState<Open>(null)
  const ids = { trade: useId(), where: useId(), list: useId() }

  const shown = useMemo(() => filterMembers(members, filters), [members, filters])
  const active = filtersActive(filters)
  const set = <K extends keyof MemberFilters>(k: K, v: MemberFilters[K]) =>
    setFilters((f) => ({ ...f, [k]: v }))

  // Suggestions: the Melbourne defaults plus anywhere a real member is based.
  const suggestions = useMemo(() => {
    const extra = members
      .filter((m) => !m.sample && m.suburb)
      .map((m) => `${m.suburb}, ${m.state} ${m.postcode}`)
    return Array.from(new Set([...SUBURB_SUGGESTIONS, ...extra]))
  }, [members])

  return (
    <div>
      <div
        role="search"
        aria-label="Filter members"
        className="rounded-2xl border border-hg-line bg-white p-4 shadow-card sm:p-5"
      >
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div>
            <label htmlFor={ids.trade} className="mb-1.5 block text-sm font-semibold">
              Trade Category
            </label>
            <select
              id={ids.trade}
              value={filters.trade}
              onChange={(e) => set('trade', e.target.value)}
              className={fieldHg}
            >
              {TRADE_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor={ids.where} className="mb-1.5 block text-sm font-semibold">
              Suburb / Postcode
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-hg-slate"
                aria-hidden="true"
              />
              <input
                id={ids.where}
                list={`${ids.where}-list`}
                value={filters.where}
                onChange={(e) => set('where', e.target.value)}
                placeholder="All Locations"
                autoComplete="off"
                className={`${fieldHg} !pl-10`}
              />
              <datalist id={`${ids.where}-list`}>
                {suggestions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          </div>

          <button
            type="button"
            aria-pressed={filters.availableOnly}
            onClick={() => set('availableOnly', !filters.availableOnly)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-[15px] font-semibold transition ${
              filters.availableOnly
                ? 'border-hg-sage-deep bg-hg-sage-deep text-white'
                : 'border-hg-slate/25 bg-white text-hg-ink hover:border-hg-slate/50'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                filters.availableOnly ? 'bg-white text-hg-sage-deep' : 'border border-hg-slate/40'
              }`}
            >
              {filters.availableOnly ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
            </span>
            Currently Available for Quotes
          </button>
        </div>

        <div className="mt-3 flex min-h-[1.75rem] items-center justify-between gap-3 text-sm text-hg-slate">
          <p id={ids.list} role="status" aria-live="polite">
            Showing {shown.length} of {members.length} members
          </p>
          {active ? (
            <button
              type="button"
              onClick={() => setFilters(NO_FILTERS)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-hg-copper-deep underline underline-offset-4 hover:bg-hg-cream"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset filters
            </button>
          ) : null}
        </div>
      </div>

      {shown.length > 0 ? (
        <ul aria-labelledby="members-title" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id}>
              <MemberCard
                member={m}
                onQuote={(member) => setDialog({ kind: 'quote', member })}
                onProfile={(member) => setDialog({ kind: 'profile', member })}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-hg-slate/30 bg-white px-6 py-14 text-center">
          <SearchX className="mx-auto h-10 w-10 text-hg-sage" strokeWidth={1.5} aria-hidden="true" />
          <h3 className="mt-4 font-heritage text-2xl font-semibold">No members match those filters</h3>
          <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-hg-slate">
            Try another trade or suburb. Or post your job and request a female tradie, and we will find a
            member who can help.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setFilters(NO_FILTERS)}
              className="inline-flex items-center gap-2 rounded-xl border border-hg-slate/30 bg-white px-5 py-3 text-[15px] font-semibold hover:border-hg-slate/60"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset filters
            </button>
            <button
              type="button"
              className={btnCopper}
              onClick={() => openPostJob({ preferHomegirl: true })}
            >
              Post a Job Now
            </button>
          </div>
        </div>
      )}

      {dialog?.kind === 'quote' ? (
        <QuoteModal member={dialog.member} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === 'profile' ? (
        <ProfileDrawer
          member={dialog.member}
          onClose={() => setDialog(null)}
          onQuote={(member) => setDialog({ kind: 'quote', member })}
        />
      ) : null}
    </div>
  )
}
