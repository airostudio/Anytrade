import Link from 'next/link'
import { BadgeCheck, FileCheck2, Heart, MapPin, ShieldCheck, Wallet, Award } from 'lucide-react'
import type { SpotlightTradie } from '@/lib/spotlight'
import PostJobButton from './PostJobButton'
import { VerifiedPill, btnPrimary } from './ui'

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function TradieSpotlight({ tradies }: { tradies: SpotlightTradie[] }) {
  return (
    <ul className="grid gap-5 md:grid-cols-3">
      {tradies.map((t) => (
        <li key={t.id}>
          <article
            className="flex h-full flex-col rounded-2xl border border-hairline bg-white p-6 shadow-card transition hover:shadow-lift"
            aria-label={`${t.name}, ${t.trade}`}
          >
            <header className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-charcoal font-heritage text-xl font-semibold text-white"
              >
                {initials(t.name)}
              </span>
              <div className="min-w-0">
                <h3 className="truncate text-lg font-bold leading-tight">
                  {t.profileHref ? (
                    <Link href={t.profileHref} className="hover:underline">
                      {t.name}
                    </Link>
                  ) : (
                    t.name
                  )}
                </h3>
                <p className="mt-0.5 text-[15px] text-charcoal-mute">{t.trade}</p>
                {t.homegirl ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-terracotta-deep">
                    <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                    Homegirls Network
                  </p>
                ) : null}
              </div>
              {t.sample ? (
                <span className="ml-auto shrink-0 rounded-full border border-charcoal/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-charcoal-mute">
                  Sample
                </span>
              ) : null}
            </header>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.licence ? <VerifiedPill icon={BadgeCheck}>Licence Verified</VerifiedPill> : null}
              {t.insured ? <VerifiedPill icon={ShieldCheck}>Insured</VerifiedPill> : null}
              {t.abn ? <VerifiedPill icon={FileCheck2}>ABN Active</VerifiedPill> : null}
            </div>

            {t.tagline ? (
              <p className="mt-4 font-heritage text-[17px] leading-snug text-charcoal-soft">
                &ldquo;{t.tagline}&rdquo;
              </p>
            ) : null}

            <dl className="mt-5 space-y-2.5 border-t border-hairline pt-4 text-[15px]">
              {t.years ? (
                <Fact icon={Award} label="Experience">
                  {t.years}+ yrs
                </Fact>
              ) : null}
              {t.suburb ? (
                <Fact icon={MapPin} label="Based in">
                  {t.suburb}
                  {t.radiusKm ? ` · ${t.radiusKm} km radius` : ''}
                </Fact>
              ) : null}
              {t.hourlyRate ? (
                <Fact icon={Wallet} label="Rate">
                  ${t.hourlyRate}/hr{t.freeQuote ? ' • Free Quote' : ''}
                </Fact>
              ) : null}
            </dl>

            <div className="mt-auto pt-6">
              <PostJobButton draft={{ category: t.tradeSlug }} className={`${btnPrimary} w-full`}>
                Request Quote
              </PostJobButton>
            </div>
          </article>
        </li>
      ))}
    </ul>
  )
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof MapPin
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-charcoal-mute" strokeWidth={1.75} aria-hidden="true" />
      <dt className="sr-only">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}
