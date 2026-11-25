'use client'

import { useRef } from 'react'
import { useFormState } from 'react-dom'
import { CheckCircle2 } from 'lucide-react'
import SubmitButton from '@/components/SubmitButton'
import { btnCopper, btnSecondary } from '@/components/home/ui'
import { joinMentorship } from '@/app/actions/network'
import Dialog, { closeDialogOf } from './Dialog'
import { Field, FormError, Honeypot, fieldHg } from './fields'

export default function MentorshipModal({ onClose }: { onClose: () => void }) {
  const [state, action] = useFormState(joinMentorship, {})
  const doneRef = useRef<HTMLButtonElement>(null)
  const sent = state.success === 'sent'

  return (
    <Dialog
      eyebrow="Support & Mentorship"
      title={sent ? 'You are on the list' : 'Join the Program'}
      onClose={onClose}
    >
      {sent ? (
        <div className="py-2 text-center" role="status">
          <CheckCircle2 className="mx-auto h-12 w-12 text-hg-sage-deep" strokeWidth={1.5} aria-hidden="true" />
          <p className="mt-4 font-heritage text-xl font-semibold">Welcome. We have your details.</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-hg-slate">
            A member of the Homegirls team will contact you within one business day to match you with a
            mentor or an apprentice.
          </p>
          <div className="mt-6">
            <button ref={doneRef} type="button" className={btnSecondary} onClick={() => closeDialogOf(doneRef.current)}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form action={action} className="relative space-y-4">
          <p className="text-[15px] leading-relaxed text-hg-slate">
            Experienced women tradies and emerging female apprentices, matched across Australia.
          </p>
          <Honeypot />
          <FormError message={state.error} />

          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">I would like to join as</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { value: 'APPRENTICE', label: 'An apprentice or emerging tradie', hint: 'Looking for a mentor' },
                { value: 'MENTOR', label: 'An experienced tradie', hint: 'Happy to mentor' },
              ].map((o, i) => (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-hg-slate/25 p-3 text-sm has-[:checked]:border-hg-ink has-[:checked]:bg-hg-paper has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-hg-copper"
                >
                  <input type="radio" name="role" value={o.value} defaultChecked={i === 0} className="mt-1 accent-hg-sage-deep" />
                  <span>
                    <span className="block font-semibold">{o.label}</span>
                    <span className="text-hg-slate">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="m-name" label="Your name">
              <input id="m-name" name="name" required autoComplete="name" className={fieldHg} />
            </Field>
            <Field id="m-phone" label="Mobile (optional)">
              <input id="m-phone" name="phone" type="tel" autoComplete="tel" placeholder="04xx xxx xxx" className={fieldHg} />
            </Field>
          </div>
          <Field id="m-email" label="Email">
            <input id="m-email" name="email" type="email" required autoComplete="email" className={fieldHg} />
          </Field>
          <Field id="m-trade" label="Trade">
            <input id="m-trade" name="trade" required placeholder="e.g. Electrical, Carpentry, Tiling" className={fieldHg} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
            <Field id="m-suburb" label="Suburb">
              <input id="m-suburb" name="suburb" required autoComplete="address-level2" className={fieldHg} />
            </Field>
            <Field id="m-postcode" label="Postcode">
              <input
                id="m-postcode"
                name="postcode"
                required
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
                autoComplete="postal-code"
                title="4-digit postcode"
                className={fieldHg}
              />
            </Field>
          </div>
          <Field id="m-msg" label="Anything we should know? (optional)">
            <textarea id="m-msg" name="message" rows={3} className={fieldHg} />
          </Field>
          <SubmitButton className={`${btnCopper} w-full`} pendingLabel="Sending…">
            Join the Program
          </SubmitButton>
        </form>
      )}
    </Dialog>
  )
}
