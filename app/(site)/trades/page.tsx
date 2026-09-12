import Link from 'next/link'
import type { Metadata } from 'next'
import { Panel, SectionHeading } from '@/components/ui'
import { TRADE_CATEGORIES } from '@/lib/constants'
import { countsByTrade } from '@/lib/repos/tradies'
import { money } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'All trades',
  description: 'Every trade covered on AnyTrade, with indicative prices for a small job.',
}

export default async function TradesIndexPage() {
  const counts = await countsByTrade()

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <SectionHeading
        eyebrow="The full list"
        title="Every trade we cover"
        blurb="Indicative prices are drawn from real quotes on AnyTrade. Small jobs sit at the bottom of each range."
      />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {TRADE_CATEGORIES.map((category) => (
          <Panel key={category.slug} className="flex h-full flex-col p-5 card-lift">
            <div className="flex items-start justify-between gap-3">
              <span className="text-3xl" aria-hidden>
                {category.icon}
              </span>
              <span className="font-mono text-xs text-ink-mute">
                {counts[category.slug] ?? 0} listed
              </span>
            </div>

            <h2 className="mt-3 font-sign text-xl font-bold uppercase tracking-wide">
              <Link href={`/trades/${category.slug}`} className="hover:text-oxide">
                {category.name}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm text-ink-soft">{category.blurb}</p>

            <p className="mt-4 border-t-2 border-dashed border-ink/25 pt-3 font-mono text-sm font-bold text-bottle">
              {money(category.typicalFrom)} – {money(category.typicalTo)}
            </p>

            <div className="mt-4 flex gap-2">
              <Link href={`/trades/${category.slug}`} className="btn-ghost btn-sm flex-1">
                Details
              </Link>
              <Link href={`/find-a-tradie?trade=${category.slug}`} className="btn-navy btn-sm flex-1">
                Find one
              </Link>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}
