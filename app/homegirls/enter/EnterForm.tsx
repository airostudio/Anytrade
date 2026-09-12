'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { unlockHomegirlsGate } from '@/app/actions/gates'

export default function EnterForm() {
  const [state, action] = useFormState(unlockHomegirlsGate, {})

  return (
    <form action={action} className="mt-5 space-y-4">
      <FormMessage error={state.error} />

      <div>
        <label className="label" htmlFor="passcode">
          Members&apos; passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoFocus
          autoComplete="off"
          className="field font-mono"
        />
      </div>

      <SubmitButton className="btn-oxide w-full" pendingLabel="Checking…">
        Enter
      </SubmitButton>
    </form>
  )
}
