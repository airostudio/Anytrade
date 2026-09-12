'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { submitBid } from '@/app/actions/bids'

export default function BidForm({
  jobId,
  creditCost,
  creditsAvailable,
  budgetHint,
}: {
  jobId: string
  creditCost: number
  creditsAvailable: number
  budgetHint: string
}) {
  const [state, action] = useFormState(submitBid, {})
  const canAfford = creditsAvailable >= creditCost

  return (
    <form action={action} className="space-y-5">
      <FormMessage error={state.error} />
      <input type="hidden" name="jobId" value={jobId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="amount">
            Your price (AUD)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min={1}
            step="any"
            required
            className="field"
            placeholder="450"
          />
          <p className="mt-1 text-xs text-ink-mute">Customer budget: {budgetHint}</p>
        </div>

        <div>
          <label className="label" htmlFor="availableFrom">
            Could start
          </label>
          <input id="availableFrom" name="availableFrom" type="date" className="field" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="estimatedHours">
            Hours on site
          </label>
          <input id="estimatedHours" name="estimatedHours" type="number" min={0} step="any" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="estimatedDays">
            Or days
          </label>
          <input id="estimatedDays" name="estimatedDays" type="number" min={0} className="field" />
        </div>
        <div>
          <label className="label" htmlFor="warrantyMonths">
            Warranty (months)
          </label>
          <input id="warrantyMonths" name="warrantyMonths" type="number" min={0} max={240} className="field" />
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2.5 border-[3px] border-ink bg-canvas px-3 py-2.5 text-sm has-[:checked]:bg-mustard">
          <input id="includesMaterials" type="checkbox" name="includesMaterials" className="h-4 w-4 accent-oxide" />
          Price includes materials
        </label>
        <label className="flex cursor-pointer items-center gap-2.5 border-[3px] border-ink bg-canvas px-3 py-2.5 text-sm has-[:checked]:bg-mustard">
          <input id="includesGst" type="checkbox" name="includesGst" defaultChecked className="h-4 w-4 accent-oxide" />
          Price includes GST
        </label>
      </div>

      <div>
        <label className="label" htmlFor="message">
          Your pitch to the customer
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          minLength={20}
          className="field"
          placeholder="What you'll do, what's included, and anything they should know. Mention similar jobs you've done."
        />
      </div>

      <div className="border-[3px] border-ink bg-canvas-deep p-4">
        <p className="text-sm">
          Submitting costs{' '}
          <strong className="font-sign uppercase tracking-wide">
            {creditCost} credit{creditCost === 1 ? '' : 's'}
          </strong>
          . You have {creditsAvailable}.
        </p>
        {!canAfford ? (
          <p className="mt-1 text-sm font-bold text-oxide">
            Not enough credits — top up on the Billing page first.
          </p>
        ) : null}
      </div>

      <SubmitButton className="btn-primary w-full" pendingLabel="Submitting quote…">
        Submit my quote
      </SubmitButton>
    </form>
  )
}
