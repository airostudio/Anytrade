'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import CheckboxGroup from '@/components/CheckboxGroup'
import { saveTradieProfile } from '@/app/actions/profile'
import { AU_STATES, HANDYMAN_SERVICES, TRADE_CATEGORIES } from '@/lib/constants'

interface Defaults {
  businessName: string
  tagline: string
  bio: string
  trades: string[]
  handymanServices: string[]
  serviceAreas: string
  acceptsSmallJobs: boolean
  availableNow: boolean
  availableWeekends: boolean
  emergencyCallouts: boolean
  freeQuotes: boolean
  hourlyRate: number | null
  calloutFee: number | null
  minimumCharge: number | null
  yearsExperience: number | null
  baseSuburb: string
  city: string
  state: string
  postcode: string
  travelRadiusKm: number
  abn: string
  licenceNumber: string
  insurerName: string
  phone: string
}

export default function ProfileForm({ tradie }: { tradie: Defaults }) {
  const [state, action] = useFormState(saveTradieProfile, {})

  return (
    <form action={action} className="space-y-7">
      <FormMessage error={state.error} success={state.success} />

      <Section legend="The basics">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" name="businessName" defaultValue={tradie.businessName} required />
          <Field label="Contact phone" name="phone" type="tel" defaultValue={tradie.phone} />
        </div>
        <div className="mt-4">
          <Field
            label="Tagline"
            name="tagline"
            defaultValue={tradie.tagline}
            maxLength={140}
            placeholder="Honest work, fair price, turns up when I say I will."
          />
        </div>
        <div className="mt-4">
          <label className="label" htmlFor="bio">
            About your business
          </label>
          <textarea id="bio" name="bio" rows={5} defaultValue={tradie.bio} className="field" />
          <p className="mt-1 text-xs text-ink-mute">
            What you do, how long you&apos;ve been at it, what makes you worth calling.
          </p>
        </div>
      </Section>

      <Section legend="Trades" hint="You'll only see leads in the trades you tick.">
        <CheckboxGroup
          name="trades"
          columns={2}
          defaultValue={tradie.trades}
          options={TRADE_CATEGORIES.map((c) => ({ value: c.slug, label: `${c.icon} ${c.name}` }))}
        />
      </Section>

      <Section legend="Small jobs you'll take" hint="The handyman list is where most of the volume is.">
        <CheckboxGroup
          name="handymanServices"
          columns={2}
          defaultValue={tradie.handymanServices}
          options={HANDYMAN_SERVICES.map((s) => ({ value: s, label: s }))}
        />
      </Section>

      <Section legend="Pricing">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Hourly rate (AUD)"
            name="hourlyRate"
            type="number"
            min={0}
            step="any"
            defaultValue={tradie.hourlyRate ?? ''}
          />
          <Field
            label="Call-out fee (AUD)"
            name="calloutFee"
            type="number"
            min={0}
            step="any"
            defaultValue={tradie.calloutFee ?? ''}
          />
          <Field
            label="Minimum charge (AUD)"
            name="minimumCharge"
            type="number"
            min={0}
            step="any"
            defaultValue={tradie.minimumCharge ?? ''}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Toggle name="freeQuotes" label="Quotes are free" defaultChecked={tradie.freeQuotes} />
          <Toggle
            name="acceptsSmallJobs"
            label="I'll take small / odd jobs"
            defaultChecked={tradie.acceptsSmallJobs}
          />
        </div>
      </Section>

      <Section legend="Where you work">
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Base suburb" name="baseSuburb" defaultValue={tradie.baseSuburb} />
          <Field label="City" name="city" defaultValue={tradie.city} />
          <div>
            <label className="label" htmlFor="state">
              State
            </label>
            <select id="state" name="state" defaultValue={tradie.state} className="field">
              <option value="">—</option>
              {AU_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <Field label="Postcode" name="postcode" maxLength={4} defaultValue={tradie.postcode} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_160px]">
          <div>
            <label className="label" htmlFor="serviceAreas">
              Suburbs you cover
            </label>
            <input
              id="serviceAreas"
              name="serviceAreas"
              defaultValue={tradie.serviceAreas}
              placeholder="Parramatta, Blacktown, Penrith"
              className="field"
            />
            <p className="mt-1 text-xs text-ink-mute">Comma separated.</p>
          </div>
          <Field
            label="Travel radius (km)"
            name="travelRadiusKm"
            type="number"
            min={1}
            max={300}
            defaultValue={tradie.travelRadiusKm}
          />
        </div>
      </Section>

      <Section legend="Availability">
        <div className="grid gap-2 sm:grid-cols-3">
          <Toggle name="availableNow" label="Taking work now" defaultChecked={tradie.availableNow} />
          <Toggle name="availableWeekends" label="Weekends" defaultChecked={tradie.availableWeekends} />
          <Toggle
            name="emergencyCallouts"
            label="Emergency call-outs"
            defaultChecked={tradie.emergencyCallouts}
          />
        </div>
      </Section>

      <Section legend="Credentials" hint="These show on your public listing so customers can check them.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="ABN" name="abn" defaultValue={tradie.abn} />
          <Field label="Licence number" name="licenceNumber" defaultValue={tradie.licenceNumber} />
          <Field label="Insurer" name="insurerName" defaultValue={tradie.insurerName} />
          <Field
            label="Years in the trade"
            name="yearsExperience"
            type="number"
            min={0}
            max={70}
            defaultValue={tradie.yearsExperience ?? ''}
          />
        </div>
      </Section>

      <SubmitButton className="btn-primary w-full" pendingLabel="Saving…">
        Save my listing
      </SubmitButton>
    </form>
  )
}

function Section({
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

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 border-[3px] border-ink bg-canvas px-3 py-2.5 text-sm has-[:checked]:bg-mustard">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 accent-oxide" />
      {label}
    </label>
  )
}
