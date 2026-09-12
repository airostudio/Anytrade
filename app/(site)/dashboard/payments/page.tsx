import Link from 'next/link'
import { auth } from '@/lib/auth'
import { EmptyState, Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { paymentsForUser } from '@/lib/repos/payments'
import { releaseJobPayment } from '@/app/actions/billing'
import { formatDate, money, PAYMENT_STATUS_LABEL, paymentStatusTone } from '@/lib/utils'
import { isStripeLive } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function ClientPaymentsPage() {
  const session = await auth()
  if (!session?.user) return null

  const payments = await paymentsForUser(session.user.id, 100)
  const held = payments.filter((p) => p.status === 'HELD_IN_ESCROW')
  const released = payments.filter((p) => p.status === 'RELEASED')

  const sum = (rows: typeof payments) => rows.reduce((total, p) => total + p.amount, 0)

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Money"
        title="Your payments"
        blurb="Paying through AnyTrade is optional — you can always settle directly with your tradie."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Held in escrow" value={money(sum(held), true)} tone="mustard" />
        <StatTile label="Released to tradies" value={money(sum(released), true)} tone="bottle" />
        <StatTile
          label="Processing"
          value={isStripeLive() ? 'Stripe (live)' : 'Demo mode'}
          hint={isStripeLive() ? undefined : 'Add Stripe keys to take real payments'}
          tone="navy"
        />
      </div>

      {payments.length ? (
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-dashed border-ink/20">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(payment.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {payment.job_id ? (
                      <Link href={`/dashboard/jobs/${payment.job_id}`} className="underline">
                        {payment.job_reference}
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{payment.description ?? payment.type}</td>
                  <td className="px-4 py-3 font-mono">{money(payment.amount, true)}</td>
                  <td className="px-4 py-3 font-mono text-ink-mute">
                    {payment.platform_fee ? money(payment.platform_fee, true) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Pill className={paymentStatusTone(payment.status)}>
                      {PAYMENT_STATUS_LABEL[payment.status]}
                    </Pill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === 'HELD_IN_ESCROW' ? (
                      <form action={releaseJobPayment}>
                        <input type="hidden" name="paymentId" value={payment.id} />
                        <button type="submit" className="btn-ghost btn-sm">
                          Release
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      ) : (
        <EmptyState
          icon="💳"
          title="No payments yet"
          blurb="When you accept a quote you can choose to fund the job into escrow. It stays there until you sign the work off."
        />
      )}
    </div>
  )
}
