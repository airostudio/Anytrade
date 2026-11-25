import type { Metadata } from 'next'
import Link from 'next/link'
import MemberDirectory from '@/components/network/MemberDirectory'
import NetworkHero from '@/components/network/NetworkHero'
import NetworkSidebar from '@/components/network/NetworkSidebar'
import { withSamples } from '@/lib/homegirls-network'
import { listPublicMembers } from '@/lib/repos/network'

export const metadata: Metadata = {
  title: 'The Homegirls Network: female tradies across Australia',
  description:
    'A trusted community of women in Australian trades. Request a female tradie for your job, browse verified members, or join the mentorship program.',
}
export const dynamic = 'force-dynamic'

export default async function HomegirlsNetworkPage() {
  const members = withSamples(await listPublicMembers())

  return (
    <div className="bg-hg-paper text-hg-ink">
      <NetworkHero />

      <div className="mx-auto grid w-full max-w-[88rem] gap-10 px-5 py-14 sm:px-8 sm:py-16 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section id="members" aria-labelledby="members-title" className="min-w-0 scroll-mt-24">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-hg-copper-deep">
            The Directory
          </p>
          <h2
            id="members-title"
            className="mt-1 font-heritage text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Meet Our Members
          </h2>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-hg-slate">
            Skilled women across the trades, each checked before they join. Request a quote directly, or
            read their profile first.
          </p>
          <div className="mt-8">
            <MemberDirectory members={members} />
          </div>
          <p className="mt-8 text-sm text-hg-slate">
            Already a member?{' '}
            <Link href="/homegirls/enter" className="font-semibold text-hg-sage-deep underline underline-offset-4">
              Enter the members area
            </Link>
            .
          </p>
        </section>

        <aside aria-label="Community and homeowner information" className="min-w-0 xl:pt-[5.75rem]">
          <NetworkSidebar />
        </aside>
      </div>
    </div>
  )
}
