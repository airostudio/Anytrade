'use client'

import { useFormState } from 'react-dom'
import SubmitButton from './SubmitButton'
import FormMessage from './FormMessage'
import { Panel, Pill, Stamp } from './ui'
import { connectPayoutAccount, openPayoutDashboard, refreshPayoutStatus } from '@/app/actions/connect'
import type { PayoutState } from '@/lib/connect'

export interface PayoutPanelProps {
  state: PayoutState
  label: string
  blurb: string
  accountId: string | null
  requirements: string[]
  /** Escrow already released but not yet transferred, in dollars. */
  awaitingTransfer: number
  stripeLive: boolean
}

const TONE: Record<PayoutState, { panel: 'navy' | 'mustard' | 'oxide' | 'canvas'; pill: string }> = {
  not_started: { panel: 'mustard', pill: 'border-ink bg-canvas text-ink' },
  incomplete: { panel: 'mustard', pill: 'border-ink bg-oxide text-canvas' },
  pending_review: { panel: 'canvas', pill: 'border-ink bg-mustard text-ink' },
  restricted: { panel: 'oxide', pill: 'border-canvas bg-canvas text-oxide' },
  ready: { panel: 'navy', pill: 'border-canvas bg-bottle text-canvas' },
}

export default function PayoutPanel(props: PayoutPanelProps) {
  const [connectState, connectAction] = useFormState(connectPayoutAccount, {})
  const [refreshState, refreshAction] = useFormState(refreshPayoutStatus, {})
  const tone = TONE[props.state]
  const onNavy = tone.panel === 'navy' || tone.panel === 'oxide'

  return (
    <Panel tone={tone.panel} className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            className={`font-sign text-sm font-bold uppercase tracking-[0.2em] ${
              onNavy ? 'text-safety' : 'text-ink-mute'
            }`}
          >
            Getting paid
          </h2>
          <p className="mt-2 font-display text-2xl leading-tight">{props.label}</p>
          <p className={`mt-2 max-w-xl text-sm ${onNavy ? 'text-canvas/85' : 'text-ink-soft'}`}>
            {props.blurb}
          </p>
        </div>
        <Pill className={tone.pill}>{props.state === 'ready' ? '✓ Connected' : 'Payouts'}</Pill>
      </div>

      <FormMessage error={connectState.error ?? refreshState.error} success={refreshState.success} />

      {props.requirements.length ? (
        <div
          className={`mt-4 border-l-4 border-safety px-3 py-2 ${
            onNavy ? 'bg-canvas/10' : 'bg-canvas-deep'
          }`}
        >
          <p className="font-sign text-xs uppercase tracking-widest">Stripe still needs</p>
          <ul className={`mt-1 space-y-0.5 text-sm ${onNavy ? 'text-canvas/85' : 'text-ink-soft'}`}>
            {props.requirements.slice(0, 6).map((requirement) => (
              <li key={requirement}>· {requirement}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {props.awaitingTransfer > 0 ? (
        <div className="mt-4 border-[3px] border-ink bg-mustard p-3 text-ink">
          <p className="font-sign text-sm font-bold uppercase tracking-wide">
            ${props.awaitingTransfer.toFixed(2)} waiting to be sent
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            Customers have signed these jobs off. The money moves as soon as your payout account is
            ready.
          </p>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        {props.state !== 'ready' ? (
          <form action={connectAction}>
            <SubmitButton className="btn-primary btn-sm" pendingLabel="Opening Stripe…">
              {props.state === 'not_started' ? 'Set up payouts' : 'Finish setting up'}
            </SubmitButton>
          </form>
        ) : null}

        {props.accountId ? (
          <>
            <form action={refreshAction}>
              <SubmitButton className="btn-ghost btn-sm" pendingLabel="Checking…">
                Check with Stripe
              </SubmitButton>
            </form>
            {props.stripeLive ? (
              <form action={openPayoutDashboard}>
                <button type="submit" className="btn-ghost btn-sm">
                  Open Stripe dashboard
                </button>
              </form>
            ) : null}
          </>
        ) : null}
      </div>

      {props.accountId ? (
        <p className={`mt-4 font-mono text-[11px] ${onNavy ? 'text-canvas/60' : 'text-ink-mute'}`}>
          {props.accountId}
        </p>
      ) : null}

      {!props.stripeLive ? (
        <div className="mt-4">
          <Stamp tone="oxide" className="bg-canvas">
            Demo mode — no real Stripe account
          </Stamp>
        </div>
      ) : null}
    </Panel>
  )
}
