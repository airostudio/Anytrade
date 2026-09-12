'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import CheckboxGroup from '@/components/CheckboxGroup'
import { signUpTradie } from '@/app/actions/auth'
import { AU_STATES, HANDYMAN_SERVICES, TRADE_CATEGORIES } from '@/lib/constants'

export default function TradieSignUpForm() {
  const [state, action] = useFormState(signUpTradie, {})

  return (
    <form action={action} className="space-y-7">
      <FormMessage error={state.error} />

      <Fieldset legend="Your details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" name="name" required autoComplete="name" />
          <Field label="Business / trading name" name="businessName" required />
          <Field label="Email" name="email" type="email" required autoComplete="email" />
          <Field label="Mobile" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div className="mt-4">
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
      </Fieldset>

      <Fieldset legend="What you do" hint="Pick every trade you want job leads for.">
        <CheckboxGroup
          name="trades"
          columns={2}
          options={TRADE_CATEGORIES.map((c) => ({ value: c.slug, label: `${c.icon} ${c.name}` }))}
        />
      </Fieldset>

      <Fieldset
        legend="Small jobs you'll take"
        hint="Optional, but handyman work is where most of the volume is."
      >
        <CheckboxGroup
          name="handymanServices"
          columns={2}
          options={HANDYMAN_SERVICES.map((s) => ({ value: s, label: s }))}
        />
      </Fieldset>

      <Fieldset legend="Where you work">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Base suburb" name="suburb" />
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
          <Field label="Postcode" name="postcode" maxLength={4} />
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="serviceAreas">
            Suburbs you cover
          </label>
          <input
            id="serviceAreas"
            name="serviceAreas"
            placeholder="Parramatta, Blacktown, Penrith"
            className="field"
          />
          <p className="mt-1 text-xs text-ink-mute">
            Separate with commas. You can refine this later in your profile.
          </p>
        </div>
      </Fieldset>

      <Fieldset legend="Credentials & pricing" hint="Adding a licence number gets you verified faster.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ABN" name="abn" />
          <Field label="Licence number" name="licenceNumber" />
          <Field label="Years in the trade" name="yearsExperience" type="number" min={0} max={70} />
          <Field label="Hourly rate (AUD)" name="hourlyRate" type="number" min={0} step="any" />
        </div>
      </Fieldset>

      <Fieldset legend="Your listing">
        <Field label="One-line tagline" name="tagline" maxLength={140} placeholder="Honest work, fair price, no call-out fee." />
        <div className="mt-4">
          <label className="label" htmlFor="bio">
            About your business
          </label>
          <textarea id="bio" name="bio" rows={4} className="field" />
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 border-[3px] border-ink bg-manila p-3">
          <input type="checkbox" name="isHomegirl" className="mt-1 h-4 w-4 accent-oxide" />
          <span className="text-sm">
            <strong className="font-sign uppercase tracking-wide">Apply to the Homegirls network</strong>
            <span className="mt-0.5 block text-ink-soft">
              Our members-only network for women working in the trades. An admin reviews every
              application.
            </span>
          </span>
        </label>
      </Fieldset>

      <SubmitButton className="btn-primary w-full" pendingLabel="Setting you up…">
        Create my tradie account
      </SubmitButton>
      <p className="text-center text-xs text-ink-mute">
        You get 5 lead credits free. No card needed to start.
      </p>
    </form>
  )
}

function Fieldset({
  legend,
  hint,
  children,
}: {
  legend: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="border-t-[3px] border-ink pt-5">
      <legend className="bg-canvas px-2 font-sign text-lg font-bold uppercase tracking-wide">
        {legend}
      </legend>
      {hint ? <p className="mb-3 text-sm text-ink-mute">{hint}</p> : null}
      {children}
    </fieldset>
  )
}

function Field({
  label,
  name,
  ...rest
}: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} className="field" {...rest} />
    </div>
  )
}
