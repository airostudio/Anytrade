'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { unlockAdminGate } from '@/app/actions/gates'

export default function UnlockForm({ next }: { next?: string }) {
  const [state, action] = useFormState(unlockAdminGate, {})

  return (
    <form action={action} className="mt-6 space-y-4">
      <FormMessage error={state.error} />
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <label className="label" htmlFor="passcode">
          Admin passcode
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

      <SubmitButton className="btn-primary w-full" pendingLabel="Checking…">
        Unlock back office
      </SubmitButton>
    </form>
  )
}
