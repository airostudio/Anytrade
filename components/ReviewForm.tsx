'use client'

import { useFormState } from 'react-dom'
import StarInput from './StarInput'
import TagPicker from './TagPicker'
import SubmitButton from './SubmitButton'
import FormMessage from './FormMessage'
import { submitReview } from '@/app/actions/reviews'
import { CLIENT_REVIEW_TAGS, RATING_CRITERIA, TRADIE_REVIEW_TAGS } from '@/lib/constants'

/**
 * The rideshare-style rating form. The client version collects sub-scores for
 * each criterion; the tradie version is a single score plus tags, because
 * rating a customer on "tidiness" makes no sense.
 */
export default function ReviewForm({
  jobId,
  direction,
  subjectName,
}: {
  jobId: string
  direction: 'CLIENT_TO_TRADIE' | 'TRADIE_TO_CLIENT'
  subjectName: string
}) {
  const [state, action] = useFormState(submitReview, {})
  const ratingTradie = direction === 'CLIENT_TO_TRADIE'

  return (
    <form action={action} className="space-y-7">
      <FormMessage error={state.error} />
      <input type="hidden" name="jobId" value={jobId} />

      <div className="border-[3px] border-ink bg-canvas-deep p-5">
        <StarInput name="rating" label={`Overall, how did ${subjectName} go?`} required />
      </div>

      {ratingTradie ? (
        <fieldset className="border-t-[3px] border-ink pt-5">
          <legend className="bg-canvas px-2 font-sign text-lg font-bold uppercase tracking-wide">
            The details
          </legend>
          <div className="space-y-3">
            {RATING_CRITERIA.map((criterion) => (
              <div key={criterion.key} className="border-2 border-ink/30 bg-canvas px-4 py-2">
                <StarInput name={criterion.key} label={criterion.label} size="sm" />
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="border-t-[3px] border-ink pt-5">
        <legend className="bg-canvas px-2 font-sign text-lg font-bold uppercase tracking-wide">
          Anything that stood out?
        </legend>
        <p className="mb-3 text-sm text-ink-mute">Tap as many as apply. Optional.</p>
        <TagPicker name="tags" options={ratingTradie ? TRADIE_REVIEW_TAGS : CLIENT_REVIEW_TAGS} />
      </fieldset>

      <fieldset className="border-t-[3px] border-ink pt-5">
        <legend className="bg-canvas px-2 font-sign text-lg font-bold uppercase tracking-wide">
          In your words
        </legend>
        <label className="label" htmlFor="comment">
          Comment <span className="font-normal normal-case text-ink-mute">(optional, but it helps)</span>
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={5}
          className="field"
          placeholder={
            ratingTradie
              ? 'What was the job, how did it go, would you use them again?'
              : 'Was the job as described? Easy access? Paid on time?'
          }
        />
        <p className="mt-1 text-xs text-ink-mute">
          {ratingTradie
            ? 'Your review is published under your first name and suburb. The tradie can reply publicly.'
            : 'Customer ratings are shown on their profile to tradies quoting on their future jobs.'}
        </p>
      </fieldset>

      <SubmitButton className="btn-primary w-full" pendingLabel="Publishing…">
        Publish my rating
      </SubmitButton>
    </form>
  )
}
