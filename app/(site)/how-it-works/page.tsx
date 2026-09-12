import Link from 'next/link'
import type { Metadata } from 'next'
import { Panel, SectionHeading, Stamp, TapeDivider } from '@/components/ui'
import { RATING_CRITERIA, TRADIE_REVIEW_TAGS, CLIENT_REVIEW_TAGS, PLATFORM_FEE_RATE } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'How it works',
  description:
    'Post a job free, compare up to six quotes, hire, pay safely and rate each other. Here is exactly how AnyTrade works for homeowners and tradies.',
}

export default function HowItWorksPage() {
  return (
    <>
      <section className="border-b-[3px] border-ink bg-navy text-canvas">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <Stamp tone="mustard" className="mb-5 bg-canvas">
            Straight down the line
          </Stamp>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">How AnyTrade works</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-canvas/85">
            No lead-gen runaround, no bait pricing. Post the job, see real numbers, pick a tradie whose
            rating you can check.
          </p>
        </div>
      </section>

      {/* Homeowners */}
      <section id="homeowners" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="For homeowners" title="From jobs list to job done" />
        <ol className="space-y-5">
          {[
            {
              n: '01',
              title: 'Post the job — free',
              body: 'Describe what needs doing, where, and roughly what you want to spend. Your address and phone number stay hidden until you hire someone.',
            },
            {
              n: '02',
              title: 'Up to six quotes come back',
              body: 'Local tradies in that trade see your job and quote a real price with a timeframe. We cap it at six so you are not fielding thirty phone calls.',
            },
            {
              n: '03',
              title: 'Compare like for like',
              body: 'Every quote shows the price, whether materials and GST are included, how long it will take, and the tradie’s rating from finished jobs.',
            },
            {
              n: '04',
              title: 'Shortlist, ask questions, hire',
              body: 'Shortlist the ones you like, message them through the job, and accept the quote you want. The others are declined automatically.',
            },
            {
              n: '05',
              title: 'Pay when you are happy',
              body: `Pay the tradie directly, or fund the job into escrow so the money is held until you sign it off. Escrow costs ${(PLATFORM_FEE_RATE * 100).toFixed(1)}% and nothing if you pay direct.`,
            },
            {
              n: '06',
              title: 'Rate each other',
              body: 'Once the job is signed off, you rate the tradie and the tradie rates you. Ratings only come from completed jobs.',
            },
          ].map((step) => (
            <li key={step.n}>
              <Panel className="flex gap-5 p-6">
                <span className="font-display text-3xl leading-none text-oxide">{step.n}</span>
                <div>
                  <h3 className="font-sign text-xl font-bold uppercase tracking-wide">{step.title}</h3>
                  <p className="mt-1.5 text-ink-soft">{step.body}</p>
                </div>
              </Panel>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link href="/post-a-job" className="btn-primary">
            Post a job
          </Link>
        </div>
      </section>

      <TapeDivider />

      {/* Ratings */}
      <section className="bg-canvas-deep">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <SectionHeading
            eyebrow="Ratings"
            title="Both sides get rated"
            blurb="Same idea as a rideshare app. After sign-off, each side rates the other out of five — and both ratings are public."
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Panel className="p-6">
              <h3 className="font-sign text-lg font-bold uppercase tracking-wide">
                You rate the tradie
              </h3>
              <p className="mt-2 text-sm text-ink-soft">
                One overall score out of five, plus a score on each of these:
              </p>
              <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                {RATING_CRITERIA.map((c) => (
                  <li key={c.key}>· {c.label}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-ink-soft">Then tap any compliments that fit:</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TRADIE_REVIEW_TAGS.slice(0, 6).map((tag) => (
                  <span key={tag} className="border-2 border-ink bg-mustard px-2 py-0.5 text-xs font-semibold">
                    {tag}
                  </span>
                ))}
              </div>
            </Panel>

            <Panel tone="navy" className="p-6">
              <h3 className="font-sign text-lg font-bold uppercase tracking-wide text-safety">
                The tradie rates you
              </h3>
              <p className="mt-2 text-sm text-canvas/85">
                Good customers get quicker quotes and keener prices. Tradies score you on how the job
                actually went:
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {CLIENT_REVIEW_TAGS.map((tag) => (
                  <span key={tag} className="border-2 border-canvas/60 px-2 py-0.5 text-xs font-semibold text-canvas">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm text-canvas/85">
                Tradies can publicly reply to any review of them. Nothing is deleted quietly — flagged
                reviews go to a human moderator.
              </p>
            </Panel>
          </div>
        </div>
      </section>

      {/* Tradies */}
      <section id="tradies" className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <SectionHeading eyebrow="For tradies" title="Winning the work" />
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              title: 'Leads that match your trade',
              body: 'Your feed only shows open jobs in the trades and suburbs you listed, that you have not already quoted on.',
            },
            {
              title: 'You choose what to spend',
              body: 'Read the whole job before you commit. A credit is only deducted when you actually submit a quote.',
            },
            {
              title: 'Quote properly, not cheaply',
              body: 'Your quote shows your rating, jobs completed, whether materials are included and any warranty. Cheapest does not always win here.',
            },
            {
              title: 'Keep your invoice',
              body: 'No commission. The only fee is on escrowed payments, and that comes out of the platform side, disclosed up front.',
            },
            {
              title: 'Get verified',
              body: 'Send us your licence and insurance and we badge your listing. Verified tradies rank above unverified ones in search.',
            },
            {
              title: 'Build a rating that sells',
              body: 'Ratings come from finished jobs only. A handful of five-star jobs will out-earn any amount of advertising.',
            },
          ].map((item) => (
            <Panel key={item.title} className="p-6">
              <h3 className="font-sign text-lg font-bold uppercase tracking-wide">{item.title}</h3>
              <p className="mt-2 text-ink-soft">{item.body}</p>
            </Panel>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/join/tradie" className="btn-primary">
            Join as a tradie
          </Link>
          <Link href="/pricing" className="btn-ghost">
            See pricing
          </Link>
        </div>
      </section>
    </>
  )
}
