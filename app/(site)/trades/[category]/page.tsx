import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TradieCard from '@/components/TradieCard'
import JobCard from '@/components/JobCard'
import SearchBar from '@/components/SearchBar'
import { EmptyState, Panel, SectionHeading, TapeDivider } from '@/components/ui'
import { TRADE_CATEGORIES, getCategory } from '@/lib/constants'
import { countTradies, searchTradies } from '@/lib/repos/tradies'
import { searchJobs } from '@/lib/repos/jobs'
import { categoryBidAverage } from '@/lib/repos/bids'
import { money, pluralise } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return TRADE_CATEGORIES.map((c) => ({ category: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: { category: string }
}): Promise<Metadata> {
  const category = getCategory(params.category)
  if (!category) return { title: 'Trade not found' }
  return {
    title: `${category.name} — find a local tradie`,
    description: category.blurb,
  }
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = getCategory(params.category)
  if (!category) notFound()

  const [tradies, total, jobs, avgBid] = await Promise.all([
    searchTradies({ trade: category.slug, sort: 'recommended', limit: 6 }),
    countTradies({ trade: category.slug }),
    searchJobs({ category: category.slug, status: ['OPEN', 'SHORTLISTING'], limit: 3 }),
    categoryBidAverage(category.slug),
  ])

  return (
    <>
      <section className="border-b-[3px] border-ink bg-navy text-canvas">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <Link href="/trades" className="text-sm text-canvas/70 underline-offset-4 hover:underline">
            ← All trades
          </Link>
          <div className="mt-4 flex items-start gap-5">
            <span className="text-5xl" aria-hidden>
              {category.icon}
            </span>
            <div>
              <h1 className="font-display text-3xl leading-tight sm:text-5xl">{category.name}</h1>
              <p className="mt-3 max-w-2xl text-lg text-canvas/85">{category.blurb}</p>
            </div>
          </div>

          <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-4 border-t-2 border-canvas/25 pt-6 sm:grid-cols-3">
            <div>
              <dt className="font-sign text-[11px] uppercase tracking-[0.18em] text-canvas/70">
                Typical small job
              </dt>
              <dd className="font-display text-2xl text-safety">
                {money(category.typicalFrom)}–{money(category.typicalTo)}
              </dd>
            </div>
            <div>
              <dt className="font-sign text-[11px] uppercase tracking-[0.18em] text-canvas/70">
                Average quote here
              </dt>
              <dd className="font-display text-2xl text-safety">{avgBid ? money(avgBid) : '—'}</dd>
            </div>
            <div>
              <dt className="font-sign text-[11px] uppercase tracking-[0.18em] text-canvas/70">
                Tradies listed
              </dt>
              <dd className="font-display text-2xl text-safety">{total}</dd>
            </div>
          </dl>

          <div className="mt-8 max-w-2xl">
            <SearchBar defaultTrade={category.slug} compact />
          </div>
        </div>
      </section>

      <TapeDivider />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div>
            <SectionHeading
              eyebrow="Local tradies"
              title={`${category.name} near you`}
              action={
                <Link href={`/find-a-tradie?trade=${category.slug}`} className="btn-ghost btn-sm">
                  See all {total}
                </Link>
              }
            />

            {tradies.length ? (
              <div className="grid gap-5 sm:grid-cols-2">
                {tradies.map((tradie) => (
                  <TradieCard key={tradie.id} tradie={tradie} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={category.icon}
                title={`No ${category.name.toLowerCase()} listed yet`}
                blurb="Post the job anyway — we notify tradies in your area when work comes up in their trade."
                action={
                  <Link href={`/post-a-job?category=${category.slug}`} className="btn-primary">
                    Post this job
                  </Link>
                }
              />
            )}

            {jobs.length ? (
              <section className="mt-14">
                <SectionHeading
                  eyebrow="Open right now"
                  title={`${pluralise(jobs.length, 'job')} waiting for a quote`}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} href="/join/tradie" cta="Quote this job" />
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="space-y-5">
            <Panel className="p-5">
              <h2 className="mb-3 border-b-2 border-safety pb-1 font-sign text-sm font-bold uppercase tracking-[0.2em]">
                Common {category.name.toLowerCase()} jobs
              </h2>
              <ul className="space-y-1.5 text-sm text-ink-soft">
                {category.common.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 font-bold text-bottle" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href={`/post-a-job?category=${category.slug}`} className="btn-primary btn-sm mt-4 w-full">
                Post a {category.name.toLowerCase()} job
              </Link>
            </Panel>

            <Panel tone="mustard" className="p-5">
              <h2 className="font-sign text-sm font-bold uppercase tracking-[0.2em]">
                Getting a fair price
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                <li>· Get at least three quotes before you decide.</li>
                <li>· Ask what is and isn&apos;t included — materials, rubbish removal, GST.</li>
                <li>· Cheapest is not always best. Check the rating and the reviews.</li>
                <li>· Bundle small jobs into one visit to save a second call-out.</li>
              </ul>
            </Panel>

            <Panel tone="manila" className="p-5">
              <h2 className="mb-3 font-sign text-sm font-bold uppercase tracking-[0.2em]">
                Other trades
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {TRADE_CATEGORIES.filter((c) => c.slug !== category.slug)
                  .slice(0, 12)
                  .map((c) => (
                    <Link
                      key={c.slug}
                      href={`/trades/${c.slug}`}
                      className="border-2 border-ink bg-canvas px-2 py-0.5 text-xs hover:bg-safety"
                    >
                      {c.name}
                    </Link>
                  ))}
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </>
  )
}
