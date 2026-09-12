import Link from 'next/link'
import { Panel, Pill, SectionHeading, StatTile, Stamp } from '@/components/ui'
import {
  listAllPayments,
  paymentsAwaitingTransfer,
  revenueByMonth,
  revenueSummary,
  unpaidTransferTotal,
} from '@/lib/repos/payments'
import { adminUpdatePayment } from '@/app/actions/admin'
import { isStripeLive } from '@/lib/stripe'
import {
  formatDate,
  money,
  PAYMENT_STATUS_LABEL,
  paymentStatusTone,
} from '@/lib/utils'
import type { PaymentStatus, PaymentType } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUSES: PaymentStatus[] = [
  'PENDING',
  'PROCESSING',
  'HELD_IN_ESCROW',
  'RELEASED',
  'REFUNDED',
  'FAILED',
  'CANCELLED',
]

const TYPES: PaymentType[] = [
  'JOB_DEPOSIT',
  'JOB_BALANCE',
  'LEAD_CREDITS',
  'MEMBERSHIP',
  'FEATURED_LISTING',
]

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string }
}) {
  const [payments, revenue, monthly, stranded, strandedTotal] = await Promise.all([
    listAllPayments({
      status: STATUSES.includes(searchParams.status as PaymentStatus)
        ? (searchParams.status as PaymentStatus)
        : undefined,
      type: TYPES.includes(searchParams.type as PaymentType)
        ? (searchParams.type as PaymentType)
        : undefined,
      limit: 300,
    }),
    revenueSummary(),
    revenueByMonth(12),
    paymentsAwaitingTransfer(),
    unpaidTransferTotal(),
  ])

  const maxMonth = Math.max(1, ...monthly.map((m) => Number(m.gross)))

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Money"
        title="Payments"
        blurb="Escrowed job payments, lead credit purchases and membership subscriptions."
        action={
          <Stamp tone={isStripeLive() ? 'bottle' : 'oxide'} className="bg-canvas">
            {isStripeLive() ? 'Stripe live' : 'Stripe demo mode'}
          </Stamp>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Gross processed" value={money(revenue.grossAllTime)} tone="navy" />
        <StatTile label="Platform fees" value={money(revenue.feesAllTime)} tone="bottle" />
        <StatTile label="In escrow" value={money(revenue.heldInEscrow)} tone="mustard" />
        <StatTile label="Released" value={money(revenue.releasedAllTime)} tone="safety" />
      </div>

      {stranded.length ? (
        <Panel tone="mustard" className="p-5">
          <p className="font-sign text-lg font-bold uppercase tracking-wide">
            {money(strandedTotal, true)} released but not yet paid out
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {stranded.length} payment{stranded.length === 1 ? '' : 's'} the customer has signed off,
            waiting on the tradie to finish Stripe Connect onboarding. Each one transfers
            automatically the moment their payout account goes live — no action needed here unless
            you want to chase them.
          </p>
          <Link href="/admin/tradies" className="btn-oxide btn-sm mt-4">
            See who needs to set payouts up
          </Link>
        </Panel>
      ) : null}

      {monthly.length ? (
        <Panel className="p-5">
          <h2 className="mb-4 font-sign text-sm font-bold uppercase tracking-[0.2em]">
            Last 12 months
          </h2>
          <div className="flex items-end gap-2 overflow-x-auto">
            {monthly.map((month) => (
              <div key={month.month} className="flex min-w-[52px] flex-1 flex-col items-center gap-1.5">
                <span className="font-mono text-[10px] text-ink-mute">
                  {money(Number(month.gross))}
                </span>
                <div
                  className="w-full border-2 border-ink bg-safety"
                  style={{ height: `${Math.max(4, (Number(month.gross) / maxMonth) * 140)}px` }}
                />
                <span className="whitespace-nowrap font-sign text-[10px] uppercase tracking-wider text-ink-mute">
                  {month.month}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel className="p-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/payments"
            className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
              !searchParams.status && !searchParams.type ? 'bg-safety' : 'bg-canvas'
            }`}
          >
            All
          </Link>
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/payments?status=${status}`}
              className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
                searchParams.status === status ? 'bg-safety' : 'bg-canvas'
              }`}
            >
              {PAYMENT_STATUS_LABEL[status]}
            </Link>
          ))}
          {TYPES.map((type) => (
            <Link
              key={type}
              href={`/admin/payments?type=${type}`}
              className={`btn-sm border-2 border-ink/40 font-sign uppercase tracking-widest ${
                searchParams.type === type ? 'bg-mustard' : 'bg-canvas'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </Link>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Who</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-right">Fee</th>
              <th className="px-4 py-3 text-right">To tradie</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payout</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="border-b border-dashed border-ink/20">
                <td className="px-4 py-3 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                <td className="px-4 py-3">
                  <span>{payment.user_name}</span>
                  <span className="block font-mono text-xs text-ink-mute">{payment.user_email}</span>
                </td>
                <td className="px-4 py-3">
                  {payment.description ?? '—'}
                  {payment.job_reference ? (
                    <span className="block font-mono text-xs text-ink-mute">
                      {payment.job_reference}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-ink-mute">{payment.type.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-right font-mono font-bold">
                  {money(payment.amount, true)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-ink-mute">
                  {payment.platform_fee ? money(payment.platform_fee, true) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-ink-mute">
                  {payment.tradesperson_amount ? money(payment.tradesperson_amount, true) : '—'}
                </td>
                <td className="px-4 py-3">
                  <Pill className={paymentStatusTone(payment.status)}>
                    {PAYMENT_STATUS_LABEL[payment.status]}
                  </Pill>
                </td>
                <td className="px-4 py-3">
                  {payment.transfer_status ? (
                    <Pill
                      className={
                        payment.transfer_status === 'paid'
                          ? 'border-bottle bg-bottle text-canvas'
                          : payment.transfer_status === 'pending_account'
                            ? 'border-ink bg-mustard text-ink'
                            : 'border-oxide bg-oxide text-canvas'
                      }
                    >
                      {payment.transfer_status.replace(/_/g, ' ')}
                    </Pill>
                  ) : (
                    <span className="text-ink-mute">—</span>
                  )}
                  {payment.transfer_error ? (
                    <span className="block max-w-[220px] truncate text-[11px] text-oxide">
                      {payment.transfer_error}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <form action={adminUpdatePayment} className="flex gap-1.5">
                    <input type="hidden" name="paymentId" value={payment.id} />
                    <select
                      name="status"
                      defaultValue={payment.status}
                      className="border-2 border-ink px-1.5 py-1 text-xs"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {PAYMENT_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="border-2 border-ink px-2 py-1 font-sign text-[11px] font-bold uppercase hover:bg-safety"
                    >
                      Set
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!payments.length ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-ink-mute">
                  No payments match that filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
