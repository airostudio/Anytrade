import { Check } from 'lucide-react'
import QuickStart from './QuickStart'
import TrustStrip from './TrustStrip'

const DOCKET = ['Fix the leaking tap', 'Hang the TV bracket', 'Adjust the sticking door', 'Replace the gate latch']

/** First screen: the promise, the 2-step quick start, and the four assurances. */
export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-hairline bg-alabaster">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-14 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-[1.35fr_1fr] lg:gap-10 lg:pb-16 lg:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-charcoal/15 bg-white px-3.5 py-1.5 text-sm font-semibold text-charcoal">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-terracotta" />
            Trusted for 55+ years · Est. 1968
          </p>
          <h1 id="hero-title" className="mt-5 font-heritage text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-charcoal sm:text-6xl lg:text-[4.25rem]">
            The odd jobs list, <span className="italic text-terracotta-deep">finally done.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-charcoal-mute sm:text-xl">
            Post the little jobs that have been sitting on your list. Compare upfront, GST-inclusive quotes
            from licence-checked local tradies and get them done in one visit.
          </p>

          <div className="mt-8">
            <QuickStart />
          </div>
        </div>

        {/* The list itself: a decorative docket, ticked off. */}
        <div aria-hidden="true" className="relative mx-auto hidden w-full max-w-sm lg:block">
          <div className="rotate-[2deg] rounded-2xl border border-hairline bg-white p-7 shadow-lift">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-charcoal-mute">This weekend</p>
            <p className="mt-1 font-heritage text-2xl font-semibold">The odd jobs list</p>
            <ul className="mt-5 divide-y divide-hairline">
              {DOCKET.map((item) => (
                <li key={item} className="flex items-center gap-3 py-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-terracotta text-charcoal">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                  <span className="text-[17px] text-charcoal-mute line-through decoration-charcoal/40 decoration-2">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-dashed border-charcoal/25 pt-4 text-sm font-semibold text-charcoal">
              One visit. One quote. Done.
            </p>
          </div>
          <div className="absolute -bottom-7 -right-4 flex h-24 w-24 rotate-6 flex-col items-center justify-center rounded-full bg-charcoal text-white shadow-lift">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">Est.</span>
            <span className="font-heritage text-2xl font-semibold leading-none">1968</span>
          </div>
        </div>
      </div>

      <div className="border-t border-hairline bg-white">
        <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8">
          <TrustStrip />
        </div>
      </div>
    </section>
  )
}
