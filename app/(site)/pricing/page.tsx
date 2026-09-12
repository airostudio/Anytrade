import Link from 'next/link'
import type { Metadata } from 'next'
import { Panel, Pill, SectionHeading, Stamp, TapeDivider } from '@/components/ui'
import { CREDIT_PACKS, MEMBERSHIP_PLANS, BID_CREDIT_COST, PLATFORM_FEE_RATE } from '@/lib/constants'
import { money } from '@/lib/utils'
import { isStripeLive } from '@/lib/stripe'

export const metadata: Metadata = {
  title: 'Pricing for tradies',
  description:
    'Buy lead credits as you go, or take a monthly membership. No commission on your invoice, cancel any time.',
}

export default function PricingPage() {
  const live = isStripeLive()

  return (
    <>
      <section className="border-b-[3px] border-ink bg-navy text-canvas">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6">
          <Stamp tone="mustard" className="mb-5 bg-canvas">
            No commission on your invoice
          </Stamp>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Pay for leads, not for luck
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-canvas/85">
            You only spend a credit when you decide a job is worth quoting on. What you invoice the
            customer is yours — we never clip it.
          </p>
        </div>
      </section>

      {/* Memberships */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          align="center"
          eyebrow="Memberships"
          title="Pick your gear"
          blurb="Every plan includes lead credits each month. Cancel any time — no lock-in."
        />

        <div className="grid gap-5 lg:grid-cols-4">
          {MEMBERSHIP_PLANS.map((plan) => (
            <Panel
              key={plan.tier}
              tone={plan.popular ? 'navy' : 'canvas'}
              className={`relative flex flex-col p-6 ${plan.popular ? 'lg:-mt-3 lg:mb-3' : ''}`}
            >
              {plan.popular ? (
                <div className="absolute -right-2 -top-3">
                  <Stamp tone="oxide" className="bg-canvas">
                    Most popular
                  </Stamp>
                </div>
              ) : null}

              <h3
                className={`font-sign text-xl font-bold uppercase tracking-wide ${
                  plan.popular ? 'text-safety' : ''
                }`}
              >
                {plan.name}
              </h3>
              <p className={`mt-1 text-sm ${plan.popular ? 'text-canvas/80' : 'text-ink-mute'}`}>
                {plan.blurb}
              </p>

              <p className="mt-4 font-display text-4xl leading-none">
                {plan.monthlyAud ? money(plan.monthlyAud) : 'Free'}
                {plan.monthlyAud ? (
                  <span className={`font-body text-sm ${plan.popular ? 'text-canvas/70' : 'text-ink-mute'}`}>
                    {' '}
                    /month
                  </span>
                ) : null}
              </p>

              {plan.includedCredits ? (
                <p className="mt-2">
                  <Pill className={plan.popular ? 'border-canvas bg-safety text-ink' : 'border-ink bg-mustard text-ink'}>
                    {plan.includedCredits} lead credits/month
                  </Pill>
                </p>
              ) : null}

              <ul
                className={`my-5 flex-1 space-y-2 text-sm ${
                  plan.popular ? 'text-canvas/85' : 'text-ink-soft'
                }`}
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className={plan.popular ? 'text-safety' : 'text-bottle'} aria-hidden>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.tier === 'FREE' ? '/join/tradie' : `/tradie/billing?plan=${plan.tier}`}
                className={plan.popular ? 'btn-primary w-full' : 'btn-ghost w-full'}
              >
                {plan.tier === 'FREE' ? 'Start free' : `Choose ${plan.name}`}
              </Link>
            </Panel>
          ))}
        </div>
      </section>

      <TapeDivider />

      {/* Credit packs */}
      <section className="bg-canvas-deep">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading
            align="center"
            eyebrow="Pay as you go"
            title="Lead credit packs"
            blurb="No membership needed. Credits never expire."
          />

          <div className="mx-auto grid max-w-4xl gap-5 md:grid-cols-3">
            {CREDIT_PACKS.map((pack) => (
              <Panel key={pack.id} className="flex flex-col p-6 text-center">
                <h3 className="font-sign text-lg font-bold uppercase tracking-wide">{pack.name}</h3>
                <p className="mt-3 font-display text-4xl leading-none text-oxide">{pack.credits}</p>
                <p className="text-sm text-ink-mute">lead credits</p>
                <p className="mt-4 font-display text-2xl">{money(pack.priceAud)}</p>
                <p className="text-xs text-ink-mute">
                  {money(pack.priceAud / pack.credits, true)} per lead
                </p>
                <p className="my-4 flex-1 text-sm text-ink-soft">{pack.blurb}</p>
                <Link href="/tradie/billing" className="btn-navy btn-sm w-full">
                  Buy credits
                </Link>
              </Panel>
            ))}
          </div>

          <Panel className="mx-auto mt-10 max-w-4xl p-6">
            <h3 className="mb-3 font-sign text-lg font-bold uppercase tracking-wide">
              What a quote costs you
            </h3>
            <div className="grid gap-3 sm:grid-cols-5">
              {Object.entries(BID_CREDIT_COST).map(([size, cost]) => (
                <div key={size} className="border-2 border-ink bg-canvas-deep px-3 py-2 text-center">
                  <p className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">
                    {size.replace(/_/g, ' ').toLowerCase()}
                  </p>
                  <p className="font-display text-xl">
                    {cost} <span className="font-body text-xs">credit{cost === 1 ? '' : 's'}</span>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-ink-mute">
              You see the full job before you spend anything. Credits are only deducted when you submit
              a quote, and refunded if the customer cancels the job before anyone is hired.
            </p>
          </Panel>
        </div>
      </section>

      {/* Escrow */}
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <SectionHeading
          align="center"
          eyebrow="Optional"
          title="Escrow payments"
          blurb="Customers can pay into escrow when they accept your quote, so you know the money is there before you start."
        />
        <Panel className="p-6">
          <dl className="grid gap-5 sm:grid-cols-3 text-center">
            <div>
              <dt className="font-sign text-xs uppercase tracking-widest text-ink-mute">
                Platform fee
              </dt>
              <dd className="font-display text-3xl text-oxide">
                {(PLATFORM_FEE_RATE * 100).toFixed(1)}%
              </dd>
              <p className="mt-1 text-xs text-ink-mute">Only on escrowed jobs. Never on direct invoices.</p>
            </div>
            <div>
              <dt className="font-sign text-xs uppercase tracking-widest text-ink-mute">Released</dt>
              <dd className="font-display text-3xl text-oxide">On sign-off</dd>
              <p className="mt-1 text-xs text-ink-mute">The customer marks the job complete.</p>
            </div>
            <div>
              <dt className="font-sign text-xs uppercase tracking-widest text-ink-mute">Processed by</dt>
              <dd className="font-display text-3xl text-oxide">Stripe</dd>
              <p className="mt-1 text-xs text-ink-mute">
                {live ? 'Live payments enabled.' : 'Demo mode until Stripe keys are added.'}
              </p>
            </div>
          </dl>
        </Panel>

        <div className="mt-10 text-center">
          <Link href="/join/tradie" className="btn-primary">
            Join AnyTrade — 5 credits free
          </Link>
        </div>
      </section>
    </>
  )
}
