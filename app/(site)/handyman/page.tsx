import Link from 'next/link'
import type { Metadata } from 'next'
import TradieCard from '@/components/TradieCard'
import SearchBar from '@/components/SearchBar'
import { EmptyState, Panel, SectionHeading, Stamp, TapeDivider } from '@/components/ui'
import { HANDYMAN_SERVICES, TRADE_CATEGORIES } from '@/lib/constants'
import { searchTradies, countTradies } from '@/lib/repos/tradies'
import { money } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Home handyman — small jobs done at the right price',
  description:
    'The odd jobs nobody else will turn up for. Flat-pack assembly, leaking taps, sticking doors, gutter cleans and the rest of the list — one handyman, one visit, one bill.',
}

export default async function HandymanPage() {
  const [handymen, total] = await Promise.all([
    searchTradies({ trade: 'handyman', smallJobsOnly: true, sort: 'recommended', limit: 6 }),
    countTradies({ smallJobsOnly: true }),
  ])

  return (
    <>
      {/* Hero */}
      <section className="relative border-b-[3px] border-ink bg-oxide text-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Stamp tone="mustard" className="mb-5 bg-canvas">
                Our specialty since 1968
              </Stamp>
              <h1 className="font-display text-4xl leading-[1.05] sm:text-5xl">
                The home handyman.
                <br />
                <span className="text-mustard">Small jobs, fair prices.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-canvas/90">
                Half the jobs around a house take an hour. Getting someone to turn up for an hour is
                the hard part. That is the whole reason AnyTrade exists.
              </p>
              <p className="mt-4 max-w-xl text-canvas/85">
                Write the list. One handyman knocks the lot over in a single visit — one call-out fee,
                one invoice, one afternoon.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/post-a-job?size=ODD_JOB&category=handyman" className="btn-primary">
                  Post your jobs list
                </Link>
                <Link
                  href="/find-a-tradie?trade=handyman&small=1"
                  className="btn border-canvas bg-transparent text-canvas shadow-none hover:bg-canvas hover:text-ink"
                >
                  Browse {total} handymen
                </Link>
              </div>
            </div>

            <Panel className="p-0">
              <div className="border-b-[3px] border-ink bg-mustard px-5 py-3">
                <p className="font-display text-xl leading-none text-ink">THE ODD JOBS LIST</p>
              </div>
              <ul className="max-h-[420px] overflow-y-auto">
                {HANDYMAN_SERVICES.map((service, i) => (
                  <li
                    key={service}
                    className="flex items-center gap-3 border-b border-dashed border-ink/20 px-5 py-2.5 text-sm text-ink-soft"
                  >
                    <span className="font-mono text-xs text-ink-mute">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {service}
                  </li>
                ))}
              </ul>
              <p className="border-t-[3px] border-ink bg-canvas-deep px-5 py-3 text-xs text-ink-mute">
                Not on the list? Post it anyway. Somebody here has done it before.
              </p>
            </Panel>
          </div>
        </div>
      </section>

      <TapeDivider />

      {/* Why bundle */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          align="center"
          eyebrow="How to keep the bill down"
          title="Bundle the little jobs"
          blurb="A call-out fee is charged once, not per task. Five small jobs in one visit costs a fraction of five separate visits."
        />
        <div className="grid gap-6 md:grid-cols-3">
          <Panel className="p-6">
            <p className="font-display text-4xl text-oxide">1 visit</p>
            <h3 className="mt-2 font-sign text-lg font-bold uppercase">One call-out fee</h3>
            <p className="mt-2 text-ink-soft">
              Most handymen charge $60–$90 to come out, then an hourly rate. Stack the jobs and you
              only pay it once.
            </p>
          </Panel>
          <Panel className="p-6">
            <p className="font-display text-4xl text-oxide">$85–$120</p>
            <h3 className="mt-2 font-sign text-lg font-bold uppercase">Typical hourly rate</h3>
            <p className="mt-2 text-ink-soft">
              Quotes on AnyTrade are itemised with GST included, so the number you see is the number
              you pay.
            </p>
          </Panel>
          <Panel className="p-6">
            <p className="font-display text-4xl text-oxide">Up to 6</p>
            <h3 className="mt-2 font-sign text-lg font-bold uppercase">Quotes to compare</h3>
            <p className="mt-2 text-ink-soft">
              Post once, get up to six real prices back. Compare them side by side with the ratings.
            </p>
          </Panel>
        </div>
      </section>

      {/* Handyman-friendly trades */}
      <section className="border-y-[3px] border-ink bg-manila">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Small jobs by trade"
            title="What a handyman can legally do"
            blurb="Some work needs a licensed tradesperson — a handyman will tell you straight, and we will route the job to a licensed one instead."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRADE_CATEGORIES.filter((c) => c.handyman).map((c) => (
              <Panel key={c.slug} className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-sign text-lg font-bold uppercase tracking-wide">
                    <Link href={`/trades/${c.slug}`} className="hover:text-oxide">
                      {c.icon} {c.name}
                    </Link>
                  </h3>
                  <span className="font-mono text-xs font-bold text-bottle">
                    {money(c.typicalFrom)}+
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                  {c.common.slice(0, 3).map((item) => (
                    <li key={item}>· {item}</li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>

          <Panel tone="navy" className="mt-8 p-6">
            <h3 className="font-sign text-lg font-bold uppercase tracking-wide text-safety">
              Where a licence is required
            </h3>
            <p className="mt-2 text-canvas/85">
              New electrical circuits, switchboard work, gas fitting, and most plumbing beyond
              changing a washer must be done by a licensed tradesperson. Post the job and AnyTrade
              sends it to licensed tradies in that trade — with the licence number on their profile so
              you can check it yourself.
            </p>
          </Panel>
        </div>
      </section>

      {/* Local handymen */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Ready to go"
          title="Handymen taking small jobs"
          action={
            <Link href="/find-a-tradie?trade=handyman&small=1" className="btn-ghost btn-sm">
              See them all
            </Link>
          }
        />

        {handymen.length ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {handymen.map((tradie) => (
              <TradieCard key={tradie.id} tradie={tradie} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="🔩"
            title="No handymen listed yet"
            blurb="Post your jobs list anyway — it goes straight into the feed for handymen in your area."
            action={
              <Link href="/post-a-job?size=ODD_JOB&category=handyman" className="btn-primary">
                Post your jobs list
              </Link>
            }
          />
        )}

        <div className="mt-10">
          <SearchBar defaultTrade="handyman" />
        </div>
      </section>
    </>
  )
}
