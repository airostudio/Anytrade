'use client'

import { useRef } from 'react'
import { useFormState } from 'react-dom'
import { CheckCircle2, Heart } from 'lucide-react'
import SubmitButton from '@/components/SubmitButton'
import { btnCopper, btnSecondary } from '@/components/home/ui'
import { requestMemberQuote } from '@/app/actions/network'
import { TIMEFRAMES, type NetworkMember } from '@/lib/homegirls-network'
import Dialog, { closeDialogOf } from './Dialog'
import { Field, FormError, Honeypot, fieldHg } from './fields'

export default function QuoteModal({
  member,
  onClose,
}: {
  member: NetworkMember
  onClose: () => void
}) {
  const [state, action] = useFormState(requestMemberQuote, {})
  const doneRef = useRef<HTMLButtonElement>(null)
  const sent = state.success === 'sent'
  const first = member.name.split(' ')[0]

  return (
    <Dialog
      eyebrow="Request a Quote"
      title={sent ? 'Request sent' : `Quote from ${member.name}`}
      onClose={onClose}
    >
      {sent ? (
        <div className="py-2 text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-hg-sage-deep" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-4 font-heritage text-xl font-semibold">Thank you. We have your request.</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-hg-slate">
            {member.sample
              ? `${member.name} is a sample profile, so the AnyTrade team will match you with a real member of the Homegirls Network who works in your area.`
              : `The AnyTrade team will pass your request on to ${first}. You will hear back within one business day.`}
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-hg-sage-tint px-3 py-1 text-sm font-semibold text-hg-sage-deep">
            <Heart className="h-4 w-4" aria-hidden="true" />
            Female Tradie Requested
          </p>
          <div className="mt-6">
            <button ref={doneRef} type="button" className={btnSecondary} onClick={() => closeDialogOf(doneRef.current)}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form action={action} className="relative space-y-4" noValidate={false}>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-hg-sage-tint px-3 py-1 text-sm font-semibold text-hg-sage-deep">
            <Heart className="h-4 w-4" aria-hidden="true" />
            Female Tradie Requested
          </p>
          <input type="hidden" name="memberId" value={member.id} />
          <input type="hidden" name="memberName" value={member.name} />
          <input type="hidden" name="memberTrade" value={member.tradeLabel} />
          <input type="hidden" name="isSample" value={String(member.sample)} />
          <Honeypot />

          {member.sample ? (
            <p className="rounded-xl border border-hg-line bg-hg-cream px-4 py-3 text-sm text-hg-slate">
              This is a sample profile. Your request goes to the AnyTrade team, who match it with a real
              member.
            </p>
          ) : null}

          <FormError message={state.error} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="q-name" label="Your name">
              <input id="q-name" name="name" required autoComplete="name" className={fieldHg} />
            </Field>
            <Field id="q-phone" label="Mobile (optional)">
              <input id="q-phone" name="phone" type="tel" autoComplete="tel" placeholder="04xx xxx xxx" className={fieldHg} />
            </Field>
          </div>
          <Field id="q-email" label="Email">
            <input id="q-email" name="email" type="email" required autoComplete="email" className={fieldHg} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field id="q-suburb" label="Suburb">
              <input id="q-suburb" name="suburb" required defaultValue={member.suburb} autoComplete="address-level2" className={fieldHg} />
            </Field>
            <Field id="q-postcode" label="Postcode">
              <input
                id="q-postcode"
                name="postcode"
                required
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                defaultValue={member.postcode}
                autoComplete="postal-code"
                title="4-digit postcode"
                className={fieldHg}
              />
            </Field>
          </div>
          <Field id="q-summary" label="Job summary" hint="One job per line works best. Sizes and photos can come later.">
            <textarea
              id="q-summary"
              name="summary"
              required
              minLength={15}
              rows={4}
              placeholder={`e.g. Re-tile the bathroom floor, about 6 square metres`}
              className={fieldHg}
            />
          </Field>
          <Field id="q-time" label="Preferred timeframe">
            <select id="q-time" name="timeframe" defaultValue="THIS_WEEK" className={fieldHg}>
              {TIMEFRAMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <SubmitButton className={`${btnCopper} w-full`} pendingLabel="Sending…">
            Send quote request
          </SubmitButton>
          <p className="text-center text-sm text-hg-slate">
            Free, with no obligation. Your phone number is only shared once you choose to proceed.
          </p>
        </form>
      )}
    </Dialog>
  )
}
