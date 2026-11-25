import { ArrowRight, Heart, ShieldCheck } from 'lucide-react'
import PostJobButton from '@/components/home/PostJobButton'
import { btnCopper } from '@/components/home/ui'
import { LeafSprig } from './LeafSprig'

/** Warm slate hero band with soft sage leaf linework. */
export default function NetworkHero() {
  return (
    <section aria-labelledby="network-title" className="relative overflow-hidden bg-hg-slate text-white">
      <LeafSprig className="pointer-events-none absolute -left-8 top-0 hidden h-[26rem] w-48 rotate-[8deg] text-hg-sage/35 sm:block" />
      <LeafSprig className="pointer-events-none absolute -right-6 -top-10 h-[30rem] w-56 -rotate-[14deg] -scale-x-100 text-hg-sage/35" />
      <LeafSprig className="pointer-events-none absolute bottom-[-9rem] right-[22%] hidden h-80 w-44 rotate-[32deg] text-hg-sage/20 lg:block" />

      <div className="relative mx-auto w-full max-w-4xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-sm font-semibold">
          <ShieldCheck className="h-4 w-4 text-hg-sage-light" strokeWidth={2} aria-hidden="true" />
          Women in Australian trades · Est. 1968
        </p>
        <h1
          id="network-title"
          className="mt-6 font-heritage text-[2.5rem] font-semibold uppercase leading-[1.05] tracking-[0.04em] sm:text-6xl lg:text-7xl"
        >
          The Homegirls Network
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/90 sm:text-xl">
          A trusted, supportive community of women in Australian trades — connecting skilled female tradies
          and apprentices with homeowners who value their craft, care, and reliability.
        </p>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PostJobButton draft={{ preferHomegirl: true }} className={btnCopper}>
            <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
            Request a Female Tradie
          </PostJobButton>
          <a
            href="#members"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-white/10"
          >
            Member Directory &amp; Mentorship
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}
