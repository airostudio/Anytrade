'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { payJobDeposit, releaseJobPayment } from '@/app/actions/billing'
import type { JobStatus } from '@/lib/types'

export default function PayButtons({
  jobId,
  jobStatus,
  escrowPaymentId,
  escrowAmount,
  alreadyPaid,
}: {
  jobId: string
  jobStatus: JobStatus
  escrowPaymentId: string | null
  escrowAmount: number | null
  alreadyPaid: boolean
}) {
  const [state, action] = useFormState(payJobDeposit, {})

  if (alreadyPaid) {
    return (
      <p className="text-sm text-canvas/85">
        Payment released to your tradie. Nothing further owing through AnyTrade.
      </p>
    )
  }

  if (escrowPaymentId) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-canvas/85">
          <strong className="font-sign uppercase tracking-wide text-safety">
            ${escrowAmount?.toFixed(2)} held in escrow.
          </strong>{' '}
          Released automatically when you sign the job off, or release it early below.
        </p>
        <form action={releaseJobPayment}>
          <input type="hidden" name="paymentId" value={escrowPaymentId} />
          <button type="submit" className="btn-primary btn-sm">
            Release payment now
          </button>
        </form>
      </div>
    )
  }

  if (jobStatus === 'COMPLETED') {
    return (
      <p className="text-sm text-canvas/85">
        This job was settled directly with the tradie. You can still pay through AnyTrade on your next
        job if you&apos;d rather use escrow.
      </p>
    )
  }

  return (
    <form action={action} className="space-y-3">
      <FormMessage error={state.error} />
      <input type="hidden" name="jobId" value={jobId} />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-lg text-sm text-canvas/85">
          Optional: pay into escrow now so the money is confirmed before work starts. We hold it and
          release it to the tradie when you mark the job complete.
        </p>
        <SubmitButton className="btn-primary btn-sm" pendingLabel="Opening checkout…">
          Pay into escrow
        </SubmitButton>
      </div>
    </form>
  )
}
