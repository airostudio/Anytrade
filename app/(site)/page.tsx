import Link from 'next/link'
import SearchBar from '@/components/SearchBar'
import JobCard from '@/components/JobCard'
import TradieCard from '@/components/TradieCard'
import Stars from '@/components/Stars'
import { Panel, Pill, SectionHeading, Stamp, TapeDivider } from '@/components/ui'
import { HANDYMAN_SERVICES, TRADE_CATEGORIES } from '@/lib/constants'
import { recentJobs } from '@/lib/repos/jobs'
import { searchTradies, countTradies, countsByTrade } from '@/lib/repos/tradies'
import { recentPublishedReviews } from '@/lib/repos/reviews'
import { platformStats } from '@/lib/repos/admin'
import { money, truncate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [jobs, featured, counts, reviews, stats, tradieCount] = await Promise.all([
    recentJobs(3),
    searchTradies({ sort: 'recommended', limit: 3, verifiedOnly: false }),
    countsByTrade(),
    recentPublishedReviews(3),
    platformStats(),
    countTradies(),
  ])

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b-[3px] border-ink bg-navy text-canvas">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #FBF4E6 0 2px, transparent 2px 46px), repeating-linear-gradient(0deg, #FBF4E6 0 2px, transparent 2px 46px)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Stamp tone="mustard" className="mb-6 bg-canvas">
                Est. 1968 · Handyman Specialists
              </Stamp>

              <h1 className="font-display text-4xl leading-[1.05] text-canvas sm:text-5xl lg:text-6xl">
                The odd jobs list,
                <br />
                <span className="text-safety">finally done.</span>
              </h1>

              <p className="mt-6 max-w-xl text-lg text-canvas/85">
                Post the job for free. Local tradies quote on it. You compare the prices, read the
                honest ratings, and pick the one you like. No call-out surprises, no chasing anybody
                for a return phone call.
              </p>

              <div className="mt-8 max-w-2xl">
                <SearchBar />
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link href="/post-a-job" className="btn-primary">
                  Post a job — it&apos;s free
                </Link>
                <Link
                  href="/handyman"
                  className="btn border-canvas bg-transparent text-canvas shadow-none hover:bg-canvas hover:text-ink"
                >
                  Small jobs &amp; handyman
                </Link>
              </div>

              <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t-2 border-canvas/25 pt-6">
                <Figure label="Jobs posted" value={stats.jobs.total.toLocaleString('en-AU')} />
                <Figure label="Tradies listed" value={tradieCount.toLocaleString('en-AU')} />
                <Figure
                  label="Average rating"
                  value={stats.reviews.avgRating ? stats.reviews.avgRating.toFixed(1) : '—'}
                />
              </dl>
            </div>

            {/* Enamel price-board panel */}
            <div className="relative">
              <Panel tone="canvas" className="p-0">
                <div className="border-b-[3px] border-ink bg-oxide px-5 py-3">
                  <p className="font-display text-2xl leading-none text-canvas">THE PRICE BOARD</p>
                  <p className="mt-1 font-sign text-xs uppercase tracking-[0.2em] text-canvas/85">
                    What a small job usually costs
                  </p>
                </div>
                <ul className="divide-y-2 divide-dashed divide-ink/20">
                  {TRADE_CATEGORIES.filter((c) => c.handyman)
                    .slice(0, 6)
                    .map((c) => (
                      <li key={c.slug} className="flex items-center justify-between gap-3 px-5 py-3">
                        <span className="flex items-center gap-2.5">
                          <span className="text-xl" aria-hidden>
                            {c.icon}
                          </span>
                          <Link
                            href={`/trades/${c.slug}`}
                            className="font-sign text-sm font-bold uppercase tracking-wide hover:text-oxide"
                          >
                            {c.name}
                          </Link>
                        </span>
                        <span className="font-mono text-sm font-bold text-bottle">
                          {money(c.typicalFrom)}–{money(c.typicalTo)}
                        </span>
                      </li>
                    ))}
                </ul>
                <p className="border-t-[3px] border-ink bg-canvas-deep px-5 py-3 text-xs text-ink-mute">
                  Indicative all-up prices from quotes on AnyTrade. Your actual quotes will be
                  itemised, GST included, before you accept anything.
                </p>
              </Panel>
              <div className="absolute -bottom-4 -left-4 hidden animate-swing lg:block">
                <Stamp tone="bottle" className="bg-canvas">
                  No hidden call-out fees
                </Stamp>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TapeDivider />

      {/* ── Handyman specialty ─────────────────────────────────────────── */}
      <section className="bg-canvas-deep">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <span className="eyebrow">Our specialty</span>
              <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
                Home handyman jobs, done at the right price
              </h2>
              <p className="mt-4 text-lg text-ink-soft">
                Most tradies won&apos;t cross town for two hours&apos; work. We built AnyTrade around
                exactly that job — the shelf that needs hanging, the gate that won&apos;t shut, the tap
                that&apos;s been dripping since Easter.
              </p>
              <p className="mt-4 text-ink-soft">
                Bundle your odd jobs into one booking and a handyman knocks them over in a single
                visit. One call-out, one bill, one afternoon.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/post-a-job?size=ODD_JOB" className="btn-primary">
                  Post your odd jobs list
                </Link>
                <Link href="/handyman" className="btn-ghost">
                  See what we cover
                </Link>
              </div>
            </div>

            <Panel className="p-6">
              <h3 className="mb-4 border-b-[3px] border-safety pb-2 font-sign text-lg font-bold uppercase tracking-widest">
                The jobs list
              </h3>
              <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                {HANDYMAN_SERVICES.slice(0, 16).map((service) => (
                  <li key={service} className="flex items-start gap-2 text-sm text-ink-soft">
                    <span className="mt-0.5 font-bold text-bottle" aria-hidden>
                      ✓
                    </span>
                    {service}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t-2 border-dashed border-ink/25 pt-4 text-sm text-ink-mute">
                Not on the list? Post it anyway — someone on AnyTrade has done it before.
              </p>
            </Panel>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          align="center"
          eyebrow="How it works"
          title="Three steps, no muck-around"
          blurb="Free to post, free to compare. You only pay the tradie you choose."
        />
        <ol className="grid gap-6 md:grid-cols-3">
          {[
            {
              n: '1',
              title: 'Tell us the job',
              body: 'Two minutes. What needs doing, where, and roughly what you want to spend. Photos help.',
            },
            {
              n: '2',
              title: 'Quotes come to you',
              body: 'Up to six local tradies quote a real price with a timeframe. Compare them side by side.',
            },
            {
              n: '3',
              title: 'Pick your tradie',
              body: 'Check their rating and reviews, accept the quote, get it done. Then rate each other.',
            },
          ].map((step) => (
            <li key={step.n}>
              <Panel className="h-full p-6">
                <span className="inline-flex h-14 w-14 items-center justify-center border-[3px] border-ink bg-safety font-display text-2xl shadow-hard-sm">
                  {step.n}
                </span>
                <h3 className="mt-4 font-sign text-xl font-bold uppercase tracking-wide">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.body}</p>
              </Panel>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Trades grid ────────────────────────────────────────────────── */}
      <section className="border-y-[3px] border-ink bg-manila">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Every trade"
            title="Pick a trade, see who's local"
            action={
              <Link href="/trades" className="btn-ghost btn-sm">
                All trades
              </Link>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {TRADE_CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                href={`/trades/${c.slug}`}
                className="group border-[3px] border-ink bg-canvas px-4 py-4 shadow-hard-sm transition-transform hover:-translate-y-1 hover:bg-safety"
              >
                <span className="text-2xl" aria-hidden>
                  {c.icon}
                </span>
                <p className="mt-2 font-sign text-sm font-bold uppercase leading-tight tracking-wide">
                  {c.name}
                </p>
                <p className="mt-1 text-xs text-ink-mute group-hover:text-ink">
                  {counts[c.slug] ?? 0} listed
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two-way ratings ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Ratings that cut both ways</span>
            <h2 className="font-display text-3xl leading-tight text-ink sm:text-4xl">
              You rate the tradie. The tradie rates you.
            </h2>
            <p className="mt-4 text-lg text-ink-soft">
              Same as getting a lift home: after the job is signed off, both sides rate each other out
              of five. Tradies score on quality, punctuality, value, communication and whether they
              left the place tidy.
            </p>
            <p className="mt-4 text-ink-soft">
              It keeps everybody honest. Good customers get quicker quotes, and a tradie&apos;s rating
              is earned on completed jobs only — no anonymous drive-by reviews.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['On time', 'Fair price', 'Clean & tidy', 'Knew their stuff', 'No surprises'].map((tag) => (
                <Pill key={tag} className="border-ink bg-mustard text-ink">
                  {tag}
                </Pill>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {reviews.length ? (
              reviews.map((review) => (
                <Panel key={review.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Stars value={review.rating} size="sm" />
                      <p className="mt-2 text-ink-soft">
                        “{truncate(review.comment ?? '', 180)}”
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 border-t-2 border-dashed border-ink/25 pt-3 text-xs uppercase tracking-wider text-ink-mute">
                    {review.reviewer_name} · {review.job_title} ·{' '}
                    {review.business_name ? (
                      <Link href={`/find-a-tradie/${review.slug}`} className="underline">
                        {review.business_name}
                      </Link>
                    ) : null}
                  </p>
                </Panel>
              ))
            ) : (
              <Panel className="p-6 text-ink-soft">
                Reviews from completed jobs appear here once the site has live data.
              </Panel>
            )}
          </div>
        </div>
      </section>

      {/* ── Live jobs ──────────────────────────────────────────────────── */}
      {jobs.length ? (
        <section className="border-y-[3px] border-ink bg-canvas-deep">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <SectionHeading
              eyebrow="On the board right now"
              title="Jobs waiting for a quote"
              blurb="This is what homeowners near you have posted in the last few days."
              action={
                <Link href="/join/tradie" className="btn-navy btn-sm">
                  Quote on these jobs
                </Link>
              }
            />
            <div className="grid gap-5 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} href="/join/tradie" cta="Quote this job" />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Featured tradies ───────────────────────────────────────────── */}
      {featured.length ? (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Highly rated"
            title="Tradies people keep going back to"
            action={
              <Link href="/find-a-tradie" className="btn-ghost btn-sm">
                Browse the directory
              </Link>
            }
          />
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((tradie) => (
              <TradieCard key={tradie.id} tradie={tradie} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Tradie + Homegirls CTAs ────────────────────────────────────── */}
      <section className="border-t-[3px] border-ink bg-navy text-canvas">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <span className="mb-3 inline-block border-b-[3px] border-safety pb-1 font-sign text-sm font-bold uppercase tracking-[0.25em] text-safety">
              For tradies
            </span>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              Fill the gaps in your week
            </h2>
            <p className="mt-4 text-canvas/85">
              Buy lead credits or take a membership, quote on the jobs that suit you, and build a
              rating that wins the next one. No lock-in contracts, no commission on your invoice.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/join/tradie" className="btn-primary">
                Join as a tradie
              </Link>
              <Link
                href="/pricing"
                className="btn border-canvas bg-transparent text-canvas shadow-none hover:bg-canvas hover:text-ink"
              >
                See pricing
              </Link>
            </div>
          </div>

          <Panel tone="manila" className="p-6">
            <Stamp tone="oxide" className="mb-4 bg-canvas">
              Members only
            </Stamp>
            <h3 className="font-display text-2xl leading-tight text-ink">The Homegirls network</h3>
            <p className="mt-3 text-ink-soft">
              A private, passcode-protected section for the women working in Australian trades — a
              members&apos; directory, a noticeboard, and mentoring. Clients who&apos;d rather book a
              woman can ask for one when they post a job.
            </p>
            <Link href="/homegirls" className="btn-oxide btn-sm mt-5">
              Enter the Homegirls section
            </Link>
          </Panel>
        </div>
      </section>
    </>
  )
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-sign text-[11px] uppercase tracking-[0.18em] text-canvas/70">{label}</dt>
      <dd className="font-display text-2xl text-safety">{value}</dd>
    </div>
  )
}
