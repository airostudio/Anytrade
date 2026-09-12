'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { Panel, Pill, Stamp } from '@/components/ui'
import { buyCredits, startMembership } from '@/app/actions/billing'
import { CREDIT_PACKS, MEMBERSHIP_PLANS } from '@/lib/constants'
import type { MembershipTier } from '@/lib/types'

export default function BuyForms({
  currentTier,
  highlightPlan,
}: {
  currentTier: MembershipTier
  highlightPlan?: string
}) {
  const [creditState, creditAction] = useFormState(buyCredits, {})
  const [planState, planAction] = useFormState(startMembership, {})

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 font-sign text-xl font-bold uppercase tracking-wide">Top up lead credits</h2>
        <FormMessage error={creditState.error} />
        <div className="grid gap-4 md:grid-cols-3">
          {CREDIT_PACKS.map((pack) => (
            <Panel key={pack.id} className="relative flex flex-col p-5 text-center">
              {pack.popular ? (
                <div className="absolute -right-2 -top-3">
                  <Stamp tone="oxide" className="bg-canvas">
                    Best value
                  </Stamp>
                </div>
              ) : null}
              <h3 className="font-sign text-lg font-bold uppercase tracking-wide">{pack.name}</h3>
              <p className="mt-3 font-display text-4xl leading-none text-oxide">{pack.credits}</p>
              <p className="text-sm text-ink-mute">credits</p>
              <p className="mt-3 font-display text-2xl">${pack.priceAud}</p>
              <p className="text-xs text-ink-mute">
                ${(pack.priceAud / pack.credits).toFixed(2)} per lead
              </p>
              <p className="my-4 flex-1 text-sm text-ink-soft">{pack.blurb}</p>
              <form action={creditAction}>
                <input type="hidden" name="packId" value={pack.id} />
                <SubmitButton className="btn-navy btn-sm w-full" pendingLabel="Opening…">
                  Buy {pack.credits} credits
                </SubmitButton>
              </form>
            </Panel>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-sign text-xl font-bold uppercase tracking-wide">Membership</h2>
        <FormMessage error={planState.error} />
        <div className="grid gap-4 lg:grid-cols-4">
          {MEMBERSHIP_PLANS.map((plan) => {
            const current = plan.tier === currentTier
            const highlighted = plan.tier === highlightPlan
            return (
              <Panel
                key={plan.tier}
                tone={current ? 'navy' : 'canvas'}
                className={`flex flex-col p-5 ${highlighted ? 'ring-4 ring-safety ring-offset-2' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`font-sign text-lg font-bold uppercase tracking-wide ${
                      current ? 'text-safety' : ''
                    }`}
                  >
                    {plan.name}
                  </h3>
                  {current ? (
                    <Pill className="border-canvas bg-safety text-ink">Current</Pill>
                  ) : null}
                </div>

                <p className="mt-3 font-display text-3xl leading-none">
                  {plan.monthlyAud ? `$${plan.monthlyAud}` : 'Free'}
                  {plan.monthlyAud ? (
                    <span className={`font-body text-sm ${current ? 'text-canvas/70' : 'text-ink-mute'}`}>
                      {' '}
                      /mo
                    </span>
                  ) : null}
                </p>

                {plan.includedCredits ? (
                  <p className={`mt-1 text-sm ${current ? 'text-canvas/80' : 'text-ink-mute'}`}>
                    {plan.includedCredits} credits included
                  </p>
                ) : null}

                <ul
                  className={`my-4 flex-1 space-y-1.5 text-sm ${
                    current ? 'text-canvas/85' : 'text-ink-soft'
                  }`}
                >
                  {plan.features.slice(0, 4).map((feature) => (
                    <li key={feature}>· {feature}</li>
                  ))}
                </ul>

                {current ? (
                  <p className={`text-center text-xs ${current ? 'text-canvas/70' : 'text-ink-mute'}`}>
                    You&apos;re on this plan
                  </p>
                ) : plan.tier === 'FREE' ? (
                  <p className="text-center text-xs text-ink-mute">
                    Cancel your membership to drop back here
                  </p>
                ) : (
                  <form action={planAction}>
                    <input type="hidden" name="tier" value={plan.tier} />
                    <SubmitButton className="btn-primary btn-sm w-full" pendingLabel="Opening…">
                      Switch to {plan.name}
                    </SubmitButton>
                  </form>
                )}
              </Panel>
            )
          })}
        </div>
      </section>
    </div>
  )
}
