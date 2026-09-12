'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { replyToReview } from '@/app/actions/reviews'

export default function ReplyForm({ reviewId }: { reviewId: string }) {
  const [state, action] = useFormState(replyToReview, {})

  return (
    <form action={action} className="space-y-3">
      <FormMessage error={state.error} success={state.success} />
      <input type="hidden" name="reviewId" value={reviewId} />
      <label className="label" htmlFor={`response-${reviewId}`}>
        Reply publicly
      </label>
      <textarea
        id={`response-${reviewId}`}
        name="response"
        rows={3}
        minLength={10}
        className="field"
        placeholder="Thanks for having me out — glad the door's behaving itself now."
      />
      <SubmitButton className="btn-ghost btn-sm" pendingLabel="Posting…">
        Post reply
      </SubmitButton>
    </form>
  )
}
