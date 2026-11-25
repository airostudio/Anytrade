import type { Metadata } from 'next'
import Image from 'next/image'
import HomegirlsCallout from '@/components/home/HomegirlsCallout'
import Hero from '@/components/home/Hero'
import OddJobsBundler from '@/components/home/OddJobsBundler'
import PostJobButton from '@/components/home/PostJobButton'
import PriceBoard from '@/components/home/PriceBoard'
import TradeGrid from '@/components/home/TradeGrid'
import TradieSpotlight from '@/components/home/TradieSpotlight'
import TwoWayRatings from '@/components/home/TwoWayRatings'
import Vetting from '@/components/home/Vetting'
import { SectionHeader, btnPrimary, container } from '@/components/home/ui'
import { getSettings } from '@/lib/repos/settings'
import { getSpotlightTradies } from '@/lib/spotlight'

export const metadata: Metadata = {
  title: { absolute: 'AnyTrade: odd jobs and trades, done right since 1968' },
  description:
    'Post your odd jobs list and compare upfront, GST-inclusive quotes from licence-checked local tradies. Australian owned since 1968.',
}
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [settings, tradies] = await Promise.all([getSettings(), getSpotlightTradies()])
  const phone = settings['site.phone'] || '1300 226 987'
  // Sample cards can't honestly sit under a claim that these tradies passed the checks.
  const showingSamples = tradies.some((t) => t.sample)

  return (
    <>
      <Hero />

      <section aria-labelledby="prices-title" className="bg-white py-16 sm:py-20">
        <div className={container}>
          <SectionHeader
            id="prices-title"
            eyebrow="Transparent pricing"
            title="What a small job usually costs"
            lead="No guessing and no surprises. Real price ranges for the jobs people ask for most, with GST included."
          />
          <div className="mt-9">
            <PriceBoard />
          </div>
        </div>
      </section>

      <section aria-labelledby="trades-title" className="bg-alabaster py-16 sm:py-20">
        <div className={container}>
          <SectionHeader
            id="trades-title"
            eyebrow="Popular trades"
            title="Find the right trade for the job"
            lead="From a dripping tap to a new deck. If you are not sure which trade you need, start with a Home Handyman."
          />
          <div className="mt-9">
            <TradeGrid />
          </div>
        </div>
      </section>

      <section aria-labelledby="bundler-title" className="bg-white py-16 sm:py-20">
        <div className={container}>
          <SectionHeader
            id="bundler-title"
            eyebrow="Odd Jobs Bundler"
            title="Got a list? Send it as one job."
            lead="Tick the small jobs that have been piling up. One tradie, one visit, one invoice."
          />
          <div className="mt-9">
            <OddJobsBundler />
          </div>
        </div>
      </section>

      <section aria-labelledby="spotlight-title" className="bg-alabaster py-16 sm:py-20">
        <div className={container}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeader
              id="spotlight-title"
              eyebrow={showingSamples ? 'Tradie profiles' : 'Tradie spotlight'}
              title={showingSamples ? 'What every AnyTrade profile shows' : 'Tradies who have passed all four checks'}
              lead={
                showingSamples
                  ? 'Verification badges, experience, service area and a clear rate, with no street addresses or phone numbers.'
                  : 'Licence, ABN, insurance and work history are looked at before a profile is badged.'
              }
            />
            <PostJobButton className={`${btnPrimary} shrink-0 self-start sm:self-auto`}>
              Get Free Quotes
            </PostJobButton>
          </div>
          <div className="mt-9">
            <TradieSpotlight tradies={tradies} />
          </div>
        </div>
      </section>

      <section aria-labelledby="heritage-title" className="bg-white py-16 sm:py-20">
        <div className={`${container} grid items-center gap-10 lg:grid-cols-2 lg:gap-16`}>
          <figure className="mx-auto w-full max-w-md lg:max-w-none">
            <div className="overflow-hidden rounded-3xl border border-hairline shadow-lift">
              <Image
                src="/images/hero-retro-tradesman.png"
                alt="Illustration of a tradie in work clothes leaning on a green ute outside a house under construction"
                width={1024}
                height={1024}
                sizes="(min-width: 1024px) 560px, 90vw"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-3 text-sm text-charcoal-mute">
              Illustration. Not a photo of an AnyTrade member.
            </figcaption>
          </figure>
          <div>
            <SectionHeader
              id="heritage-title"
              eyebrow="Est. 1968"
              title="Honest work, honestly priced."
              lead="For over 55 years the idea has been the same: a fair price agreed up front, a tradie who turns up, and a job done properly the first time."
            />
            <ul className="mt-6 space-y-3 text-lg text-charcoal-soft">
              <li>Upfront, GST-inclusive quotes before any work starts.</li>
              <li>Small jobs welcome, from a single tap to a whole odd-jobs list.</li>
              <li>A real person on our Australian support line.</li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="Why trust AnyTrade" className="bg-charcoal py-16 text-white sm:py-20">
        <div className={container}>
          <Vetting phone={phone} />
        </div>
      </section>

      <section aria-label="Accountability and the Homegirls Network" className="bg-alabaster py-16 sm:py-20">
        <div className={`${container} grid gap-6 lg:grid-cols-[1.35fr_1fr]`}>
          <TwoWayRatings />
          <HomegirlsCallout />
        </div>
      </section>

      <section aria-labelledby="cta-title" className="border-t border-hairline bg-white py-16 text-center sm:py-20">
        <div className={`${container} max-w-3xl`}>
          <h2
            id="cta-title"
            className="font-heritage text-3xl font-semibold leading-tight tracking-tight sm:text-5xl"
          >
            Ready to tick the list off?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-charcoal-mute">
            Post your job in about two minutes. It is free to post and free to compare quotes.
          </p>
          <div className="mt-8 flex justify-center">
            <PostJobButton className={btnPrimary}>Get Free Quotes</PostJobButton>
          </div>
        </div>
      </section>
    </>
  )
}
