import Link from 'next/link'
import { ArrowRight, Heart } from 'lucide-react'
import PostJobButton from './PostJobButton'

/** Warm, editorial card for the Homegirls Network (female tradies on request). */
export default function HomegirlsCallout() {
  return (
    <section
      aria-labelledby="homegirls-title"
      className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-terracotta-deep p-7 text-white shadow-lift sm:p-9"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border-[28px] border-white/10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full border-[22px] border-white/[0.07]"
      />

      <p className="relative inline-flex w-fit items-center gap-2 rounded-full bg-charcoal/25 px-3 py-1 text-sm font-semibold">
        <Heart className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        The Homegirls Network
      </p>

      <h2
        id="homegirls-title"
        className="relative mt-5 font-heritage text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
      >
        Prefer a woman on the tools?
      </h2>
      <p className="relative mt-4 text-lg leading-relaxed text-white/90">
        Plenty of homeowners are more comfortable with a female tradie in the house. When you post a job,
        ask for one and your request goes to women in the Homegirls Network.
      </p>
      <p className="relative mt-4 text-[15px] leading-relaxed text-white/90">
        Same licence and insurance checks. Same upfront pricing. Same two-way ratings.
      </p>

      <div className="relative mt-auto pt-8">
        <PostJobButton
          draft={{ preferHomegirl: true, category: 'handyman' }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-charcoal transition hover:bg-alabaster active:translate-y-px sm:w-auto"
        >
          Request a female tradie
          <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
        </PostJobButton>
        <Link
          href="/homegirls-network"
          className="mt-4 block text-center text-[15px] font-semibold underline underline-offset-4 hover:text-white/80 sm:ml-5 sm:inline sm:text-left"
        >
          Meet the network
        </Link>
      </div>
    </section>
  )
}
