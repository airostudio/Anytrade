import Link from 'next/link'
import type { Metadata } from 'next'
import TradieCard from '@/components/TradieCard'
import SearchBar from '@/components/SearchBar'
import { EmptyState, Panel, SectionHeading } from '@/components/ui'
import { TRADE_CATEGORIES, categoryName } from '@/lib/constants'
import { countTradies, searchTradies, topServiceAreas, type DirectoryFilters } from '@/lib/repos/tradies'
import { pluralise } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Find a tradie near you',
  description:
    'Search AnyTrade for licensed, rated local tradespeople — handyman, plumbing, electrical, carpentry and more.',
}

const PAGE_SIZE = 12

interface SearchParams {
  trade?: string
  suburb?: string
  q?: string
  rating?: string
  verified?: string
  homegirls?: string
  available?: string
  small?: string
  sort?: string
  page?: string
}

export default async function DirectoryPage({ searchParams }: { searchParams: SearchParams }) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1)

  const filters: DirectoryFilters = {
    trade: searchParams.trade || undefined,
    suburb: searchParams.suburb || undefined,
    q: searchParams.q || undefined,
    minRating: searchParams.rating ? Number(searchParams.rating) : undefined,
    verifiedOnly: searchParams.verified === '1',
    homegirlsOnly: searchParams.homegirls === '1',
    availableNow: searchParams.available === '1',
    smallJobsOnly: searchParams.small === '1',
    sort: (searchParams.sort as DirectoryFilters['sort']) || 'recommended',
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }

  const [tradies, total, areas] = await Promise.all([
    searchTradies(filters),
    countTradies(filters),
    topServiceAreas(14),
  ])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const heading = filters.trade ? `${categoryName(filters.trade)} tradies` : 'The directory'
  const where = filters.suburb ? ` in ${filters.suburb}` : ''

  const linkWith = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries({ ...searchParams, ...patch })) {
      if (value) next.set(key, String(value))
    }
    next.delete('page')
    return `/find-a-tradie?${next.toString()}`
  }

  return (
    <>
      <section className="border-b-[3px] border-ink bg-navy text-canvas">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="font-display text-3xl leading-tight sm:text-4xl">
            {heading}
            {where}
          </h1>
          <p className="mt-2 text-canvas/80">
            {pluralise(total, 'tradie')} listed. Ratings come from finished jobs only.
          </p>
          <div className="mt-6">
            <SearchBar defaultTrade={filters.trade ?? ''} defaultSuburb={filters.suburb ?? ''} compact />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[250px_1fr]">
        {/* Filters */}
        <aside className="space-y-5">
          <Panel className="p-4">
            <h2 className="mb-3 border-b-2 border-safety pb-1 font-sign text-sm font-bold uppercase tracking-[0.2em]">
              Narrow it down
            </h2>
            <form method="get" className="space-y-4">
              {filters.suburb ? <input type="hidden" name="suburb" value={filters.suburb} /> : null}

              <div>
                <label className="label" htmlFor="trade">
                  Trade
                </label>
                <select id="trade" name="trade" defaultValue={filters.trade ?? ''} className="field border-2 py-2">
                  <option value="">Any trade</option>
                  {TRADE_CATEGORIES.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" htmlFor="rating">
                  Minimum rating
                </label>
                <select id="rating" name="rating" defaultValue={searchParams.rating ?? ''} className="field border-2 py-2">
                  <option value="">Any rating</option>
                  <option value="4.5">4.5 stars and up</option>
                  <option value="4">4 stars and up</option>
                  <option value="3.5">3.5 stars and up</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="sort">
                  Sort by
                </label>
                <select id="sort" name="sort" defaultValue={searchParams.sort ?? 'recommended'} className="field border-2 py-2">
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest rated</option>
                  <option value="price">Lowest hourly rate</option>
                  <option value="reviews">Most reviewed</option>
                  <option value="experience">Most experienced</option>
                </select>
              </div>

              <fieldset className="space-y-2 border-t-2 border-dashed border-ink/25 pt-4">
                <legend className="label mb-0">Only show</legend>
                <Toggle name="verified" label="Licence checked" checked={filters.verifiedOnly} />
                <Toggle name="small" label="Takes small jobs" checked={filters.smallJobsOnly} />
                <Toggle name="available" label="Available now" checked={filters.availableNow} />
                <Toggle name="homegirls" label="Homegirls members" checked={filters.homegirlsOnly} />
              </fieldset>

              <div className="flex gap-2">
                <button type="submit" className="btn-navy btn-sm flex-1">
                  Apply
                </button>
                <Link href="/find-a-tradie" className="btn-ghost btn-sm">
                  Reset
                </Link>
              </div>
            </form>
          </Panel>

          {areas.length ? (
            <Panel tone="manila" className="p-4">
              <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
                Areas we cover
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {areas.map((area) => (
                  <Link
                    key={area.suburb}
                    href={linkWith({ suburb: area.suburb })}
                    className="border-2 border-ink bg-canvas px-2 py-0.5 text-xs hover:bg-safety"
                  >
                    {area.suburb} <span className="text-ink-mute">({area.count})</span>
                  </Link>
                ))}
              </div>
            </Panel>
          ) : null}
        </aside>

        {/* Results */}
        <div>
          {tradies.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {tradies.map((tradie) => (
                  <TradieCard key={tradie.id} tradie={tradie} />
                ))}
              </div>

              {pages > 1 ? (
                <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
                  {Array.from({ length: pages }, (_, i) => i + 1).map((n) => {
                    const params = new URLSearchParams()
                    for (const [key, value] of Object.entries(searchParams)) {
                      if (value) params.set(key, String(value))
                    }
                    params.set('page', String(n))
                    return (
                      <Link
                        key={n}
                        href={`/find-a-tradie?${params.toString()}`}
                        aria-current={n === page ? 'page' : undefined}
                        className={`border-[3px] border-ink px-3.5 py-1.5 font-sign text-sm font-bold ${
                          n === page ? 'bg-safety shadow-hard-sm' : 'bg-canvas hover:bg-canvas-deep'
                        }`}
                      >
                        {n}
                      </Link>
                    )
                  })}
                </nav>
              ) : null}
            </>
          ) : (
            <EmptyState
              icon="🔦"
              title="Nobody matches that yet"
              blurb="Try widening the trade or clearing a filter. Or post the job — tradies come to you."
              action={
                <div className="flex flex-wrap justify-center gap-3">
                  <Link href="/post-a-job" className="btn-primary">
                    Post the job instead
                  </Link>
                  <Link href="/find-a-tradie" className="btn-ghost">
                    Clear filters
                  </Link>
                </div>
              }
            />
          )}

          <section className="mt-14">
            <SectionHeading eyebrow="Browse" title="Every trade we cover" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {TRADE_CATEGORIES.map((c) => (
                <Link
                  key={c.slug}
                  href={`/trades/${c.slug}`}
                  className="border-2 border-ink bg-canvas px-3 py-2 text-sm font-semibold hover:bg-mustard"
                >
                  {c.icon} {c.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

function Toggle({ name, label, checked }: { name: string; label: string; checked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" name={name} value="1" defaultChecked={checked} className="h-4 w-4 accent-oxide" />
      {label}
    </label>
  )
}
