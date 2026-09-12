'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { sendEnquiry } from '@/app/actions/contact'

const SUBJECTS = [
  'A question about a job',
  'A problem with a tradie',
  'A problem with a customer',
  'Billing or membership',
  'Verify my licence',
  'Homegirls network',
  'Something else',
]

export default function ContactForm() {
  const [state, action] = useFormState(sendEnquiry, {})

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">
            Your name
          </label>
          <input id="name" name="name" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="field" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Phone <span className="font-normal normal-case text-ink-mute">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="suburb">
            Suburb <span className="font-normal normal-case text-ink-mute">(optional)</span>
          </label>
          <input id="suburb" name="suburb" className="field" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="subject">
          What&apos;s it about?
        </label>
        <select id="subject" name="subject" className="field">
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="message">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          minLength={10}
          placeholder="Include the job reference (AT-XXXXX) if it's about a specific job."
          className="field"
        />
      </div>

      <SubmitButton className="btn-primary w-full" pendingLabel="Sending…">
        Send message
      </SubmitButton>
    </form>
  )
}
