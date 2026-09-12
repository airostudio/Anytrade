import Link from 'next/link'
import { auth } from '@/lib/auth'
import { Panel, Pill, SectionHeading, StatTile, Stamp } from '@/components/ui'
import { getTradieByUserId, creditHistory } from '@/lib/repos/tradies'
import { paymentsForUser, paymentsAwaitingTransfer } from '@/lib/repos/payments'
import { describeRequirement, payoutSummary } from '@/lib/connect'
import PayoutPanel from '@/components/PayoutPanel'
import { isStripeLive } from '@/lib/stripe'
import { MEMBERSHIP_PLANS } from '@/lib/constants'
import {
  formatDate,
  formatDateTime,
  MEMBERSHIP_LABEL,
  money,
  PAYMENT_STATUS_LABEL,
  paymentStatusTone,
} from '@/lib/utils'
import type { CreditLedgerRow, PaymentStatus, TransferStatus } from '@/lib/types'
import { earningsForTradie } from '@/lib/repos/payments'
import BuyForms from './BuyForms'

export const dynamic = 'force-dynamic'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { paid?: string; demo?: string; cancelled?: string; plan?: string }
}) {
  const session = await auth()
  if (!session?.user) return null

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return null

  const [payments, ledger, awaiting] = await Promise.all([
    paymentsForUser(session.user.id, 50),
    creditHistory(tradie.id, 25) as Promise<CreditLedgerRow[]>,
    paymentsAwaitingTransfer(tradie.id),
  ])

  const payouts = payoutSummary(tradie)
  const awaitingTotal = awaiting.reduce((total, p) => total + p.tradesperson_amount, 0)
  const jobEarnings = await earningsForTradie(tradie.id)

  const live = isStripeLive()
  const currentPlan = MEMBERSHIP_PLANS.find((p) => p.tier === tradie.membership_tier)

  // Next drops the query string on the native form-POST redirect path, so the
  // confirmation is derived from the data instead: a purchase settled in the
  // last couple of minutes is the one they just made.
  const justPurchased = payments.find(
    (p) =>
      ['LEAD_CREDITS', 'MEMBERSHIP'].includes(p.type) &&
      p.status === 'RELEASED' &&
      Date.now() - new Date(p.created_at).getTime() < 120_000
  )
  const spent = payments
    .filter((p) => ['RELEASED', 'HELD_IN_ESCROW'].includes(p.status))
    .reduce((total, p) => total + p.amount, 0)

  return (
    <div className="space-y-8">
      {searchParams.paid || searchParams.demo || justPurchased ? (
        <Panel tone="mustard" className="p-5">
          <p className="font-sign text-lg font-bold uppercase tracking-wide">
            {live ? 'Payment received — thanks' : 'Demo purchase applied'}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {justPurchased ? `${justPurchased.description} · ${money(justPurchased.amount)}. ` : ''}
            {live
              ? 'Your account has been updated. A receipt is on its way to your email.'
              : 'Stripe keys are not configured on this deployment, so nothing was charged. Your account was credited so you can see the full flow.'}
          </p>
        </Panel>
      ) : null}

      {searchParams.cancelled ? (
        <Panel className="p-4">
          <p className="text-sm text-ink-soft">Checkout cancelled — nothing was charged.</p>
        </Panel>
      ) : null}

      <SectionHeading
        eyebrow="Billing"
        title="Credits & membership"
        blurb="You only ever pay for leads and membership. AnyTrade takes no commission on what you invoice."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Lead credits" value={tradie.lead_credits} tone="safety" />
        <StatTile
          label="Membership"
          value={MEMBERSHIP_LABEL[tradie.membership_tier]}
          hint={
            tradie.membership_ends_at
              ? `Renews ${formatDate(tradie.membership_ends_at)}`
              : 'Pay as you go'
          }
          tone="navy"
        />
        <StatTile label="Spent with us" value={money(spent)} tone="bottle" />
        <StatTile
          label="Payments"
          value={live ? 'Stripe live' : 'Demo mode'}
          hint={live ? undefined : 'Add STRIPE_SECRET_KEY to go live'}
          tone="mustard"
        />
      </div>

      {!live ? (
        <Panel className="border-dashed p-5">
          <Stamp tone="oxide" className="mb-3 bg-canvas">
            Demo mode
          </Stamp>
          <p className="text-sm text-ink-soft">
            No Stripe keys are set on this deployment, so purchases complete instantly without a card
            and are recorded exactly as a real payment would be. Set{' '}
            <code className="bg-ink/10 px-1 font-mono">STRIPE_SECRET_KEY</code> and{' '}
            <code className="bg-ink/10 px-1 font-mono">STRIPE_WEBHOOK_SECRET</code> to switch to live
            Checkout.
          </p>
        </Panel>
      ) : null}

      <PayoutPanel
        state={payouts.state}
        label={payouts.label}
        blurb={payouts.blurb}
        accountId={payouts.accountId}
        requirements={payouts.requirements.map(describeRequirement)}
        awaitingTransfer={awaitingTotal}
        stripeLive={live}
      />

      <BuyForms currentTier={tradie.membership_tier} highlightPlan={searchParams.plan} />

      {/* Credit ledger */}
      <section>
        <h2 className="mb-4 font-sign text-xl font-bold uppercase tracking-wide">Credit history</h2>
        {ledger.length ? (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3 text-right">Change</th>
                  <th className="px-4 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledger.map((entry) => (
                  <tr key={entry.id} className="border-b border-dashed border-ink/20">
                    <td className="px-4 py-3 whitespace-nowrap text-ink-mute">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <Pill className="border-ink bg-canvas-deep text-ink-soft">
                        {entry.reason.replace(/_/g, ' ')}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{entry.note ?? '—'}</td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-bold ${
                        entry.delta > 0 ? 'text-bottle' : 'text-oxide'
                      }`}
                    >
                      {entry.delta > 0 ? '+' : ''}
                      {entry.delta}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{entry.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : (
          <Panel className="p-5 text-sm text-ink-soft">
            No credit movements yet. Your sign-up credits will show here.
          </Panel>
        )}
      </section>

      {/* Job earnings */}
      <section>
        <h2 className="mb-4 font-sign text-xl font-bold uppercase tracking-wide">Job earnings</h2>
        {jobEarnings.length ? (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3 text-right">Customer paid</th>
                  <th className="px-4 py-3 text-right">AnyTrade fee</th>
                  <th className="px-4 py-3 text-right">Your share</th>
                  <th className="px-4 py-3">Payout</th>
                </tr>
              </thead>
              <tbody>
                {jobEarnings.map((payment) => (
                  <tr key={payment.id} className="border-b border-dashed border-ink/20">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                    <td className="px-4 py-3">
                      {payment.job_title ?? payment.description ?? '—'}
                      {payment.job_reference ? (
                        <span className="block font-mono text-xs text-ink-mute">
                          {payment.job_reference}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{money(payment.amount, true)}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink-mute">
                      −{money(payment.platform_fee, true)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {money(payment.tradesperson_amount, true)}
                    </td>
                    <td className="px-4 py-3">
                      <Pill className={transferTone(payment.transfer_status, payment.status)}>
                        {transferLabel(payment.transfer_status, payment.status)}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : (
          <Panel className="p-5 text-sm text-ink-soft">
            No escrowed job payments yet. Customers can choose to pay through AnyTrade when they
            accept your quote.
          </Panel>
        )}
      </section>

      {/* Invoices */}
      <section>
        <h2 className="mb-4 font-sign text-xl font-bold uppercase tracking-wide">Invoices</h2>
        {payments.length ? (
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-dashed border-ink/20">
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                    <td className="px-4 py-3">{payment.description ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-mute">{payment.type.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-right font-mono">{money(payment.amount, true)}</td>
                    <td className="px-4 py-3">
                      <Pill className={paymentStatusTone(payment.status)}>
                        {PAYMENT_STATUS_LABEL[payment.status]}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        ) : (
          <Panel className="p-5 text-sm text-ink-soft">No invoices yet.</Panel>
        )}
      </section>

      <Panel tone="manila" className="p-5">
        <p className="text-sm text-ink-soft">
          Questions about billing or a refund? {currentPlan ? `You're on ${currentPlan.name}. ` : ''}
          <Link href="/contact" className="font-bold underline underline-offset-4">
            Talk to the office
          </Link>
          .
        </p>
      </Panel>
    </div>
  )
}


/** How a job payment's payout leg reads to the tradie. */
function transferLabel(transfer: TransferStatus | null, payment: PaymentStatus): string {
  if (transfer === 'paid') return 'Paid out'
  if (transfer === 'failed') return 'Payout failed'
  if (transfer === 'reversed') return 'Reversed'
  if (transfer === 'pending_account') return 'Waiting on your account'
  if (payment === 'HELD_IN_ESCROW') return 'Held in escrow'
  return PAYMENT_STATUS_LABEL[payment]
}

function transferTone(transfer: TransferStatus | null, payment: PaymentStatus): string {
  if (transfer === 'paid') return 'border-bottle bg-bottle text-canvas'
  if (transfer === 'failed' || transfer === 'reversed') return 'border-oxide bg-oxide text-canvas'
  if (transfer === 'pending_account') return 'border-ink bg-mustard text-ink'
  if (payment === 'HELD_IN_ESCROW') return 'border-ink bg-canvas-dark text-ink'
  return paymentStatusTone(payment)
}
