'use client'

import { useState } from 'react'
import { acceptBid } from '@/app/actions/jobs'
import { rejectBid, toggleShortlist } from '@/app/actions/bids'

/**
 * Accept / shortlist / decline. Accepting is irreversible — it declines every
 * other quote — so it asks for a confirmation first.
 */
export default function BidActions({
  bidId,
  jobId,
  shortlisted,
  businessName,
  amount,
}: {
  bidId: string
  jobId: string
  shortlisted: boolean
  businessName: string
  amount: string
}) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="border-[3px] border-oxide bg-canvas p-3">
        <p className="text-sm font-semibold">
          Hire {businessName} for {amount}?
        </p>
        <p className="mt-1 text-xs text-ink-mute">Every other quote on this job will be declined.</p>
        <div className="mt-3 flex gap-2">
          <form action={acceptBid} className="flex-1">
            <input type="hidden" name="jobId" value={jobId} />
            <input type="hidden" name="bidId" value={bidId} />
            <button type="submit" className="btn-primary btn-sm w-full">
              Yes, hire
            </button>
          </form>
          <button type="button" onClick={() => setConfirming(false)} className="btn-ghost btn-sm">
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setConfirming(true)} className="btn-primary btn-sm w-full">
        Accept quote
      </button>

      <form action={toggleShortlist}>
        <input type="hidden" name="bidId" value={bidId} />
        <input type="hidden" name="shortlisted" value={String(!shortlisted)} />
        <button type="submit" className="btn-ghost btn-sm w-full">
          {shortlisted ? 'Remove shortlist' : 'Shortlist'}
        </button>
      </form>

      <form action={rejectBid}>
        <input type="hidden" name="bidId" value={bidId} />
        <button
          type="submit"
          className="w-full border-2 border-ink/30 px-3 py-1.5 font-sign text-xs font-bold uppercase tracking-widest text-ink-mute hover:border-oxide hover:text-oxide"
        >
          Decline
        </button>
      </form>
    </div>
  )
}
