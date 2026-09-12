'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { changeOwnPassword, saveClientProfile } from '@/app/actions/profile'
import { AU_STATES } from '@/lib/constants'

export default function AccountForms({
  defaults,
}: {
  defaults: { name: string; phone: string; suburb: string; state: string; postcode: string }
}) {
  const [profileState, profileAction] = useFormState(saveClientProfile, {})
  const [passwordState, passwordAction] = useFormState(changeOwnPassword, {})

  return (
    <div className="space-y-10">
      <form action={profileAction} className="space-y-4">
        <FormMessage error={profileState.error} success={profileState.success} />

        <div>
          <label className="label" htmlFor="name">
            Name
          </label>
          <input id="name" name="name" defaultValue={defaults.name} required className="field" />
        </div>

        <div>
          <label className="label" htmlFor="phone">
            Mobile
          </label>
          <input id="phone" name="phone" type="tel" defaultValue={defaults.phone} className="field" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="suburb">
              Suburb
            </label>
            <input id="suburb" name="suburb" defaultValue={defaults.suburb} className="field" />
          </div>
          <div>
            <label className="label" htmlFor="state">
              State
            </label>
            <select id="state" name="state" defaultValue={defaults.state} className="field">
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
            <input id="postcode" name="postcode" maxLength={4} defaultValue={defaults.postcode} className="field" />
          </div>
        </div>

        <SubmitButton className="btn-primary" pendingLabel="Saving…">
          Save details
        </SubmitButton>
      </form>

      <form action={passwordAction} className="space-y-4 border-t-[3px] border-ink pt-7">
        <h3 className="font-sign text-lg font-bold uppercase tracking-wide">Change password</h3>
        <FormMessage error={passwordState.error} success={passwordState.success} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="password">
              New password
            </label>
            <input id="password" name="password" type="password" minLength={8} required className="field" />
          </div>
          <div>
            <label className="label" htmlFor="confirm">
              Confirm
            </label>
            <input id="confirm" name="confirm" type="password" minLength={8} required className="field" />
          </div>
        </div>

        <SubmitButton className="btn-ghost" pendingLabel="Updating…">
          Update password
        </SubmitButton>
      </form>
    </div>
  )
}
