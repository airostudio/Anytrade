'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { signUpClient } from '@/app/actions/auth'
import { AU_STATES } from '@/lib/constants'

export default function ClientSignUpForm() {
  const [state, action] = useFormState(signUpClient, {})

  return (
    <form action={action} className="mt-6 space-y-4">
      <FormMessage error={state.error} />

      <div>
        <label className="label" htmlFor="name">
          Your name
        </label>
        <input id="name" name="name" required autoComplete="name" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="field"
        />
        <p className="mt-1 text-xs text-ink-mute">At least 8 characters.</p>
      </div>

      <div>
        <label className="label" htmlFor="phone">
          Mobile <span className="font-normal normal-case text-ink-mute">(optional)</span>
        </label>
        <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label className="label" htmlFor="suburb">
            Suburb
          </label>
          <input id="suburb" name="suburb" className="field" />
        </div>
        <div>
          <label className="label" htmlFor="state">
            State
          </label>
          <select id="state" name="state" className="field">
            <option value="">—</option>
            {AU_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="postcode">
            Postcode
          </label>
          <input id="postcode" name="postcode" maxLength={4} inputMode="numeric" className="field" />
        </div>
      </div>

      <SubmitButton className="btn-primary w-full" pendingLabel="Creating account…">
        Create my account
      </SubmitButton>
    </form>
  )
}
