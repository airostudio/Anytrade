'use client'

import { useFormState } from 'react-dom'
import SubmitButton from '@/components/SubmitButton'
import FormMessage from '@/components/FormMessage'
import { postJob } from '@/app/actions/jobs'
import { AU_STATES, JOB_SIZES, JOB_URGENCIES, TRADE_CATEGORIES } from '@/lib/constants'

export default function PostJobForm({
  defaultCategory,
  defaultSize,
}: {
  defaultCategory: string
  defaultSize: string
}) {
  const [state, action] = useFormState(postJob, {})

  return (
    <form action={action} className="space-y-7">
      <FormMessage error={state.error} />

      <Section legend="The job">
        <div>
          <label className="label" htmlFor="title">
            Short title
          </label>
          <input
            id="title"
            name="title"
            required
            maxLength={120}
            placeholder="Hang three shelves and fix a sticking door"
            className="field"
          />
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="category">
            Trade needed
          </label>
          <select id="category" name="category" required defaultValue={defaultCategory} className="field">
            <option value="">Pick a trade</option>
            {TRADE_CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink-mute">
            Not sure? Pick Home Handyman — they&apos;ll tell you if it needs a licensed tradie.
          </p>
        </div>

        <div className="mt-4">
          <label className="label" htmlFor="description">
            What needs doing?
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            minLength={20}
            placeholder={
              'List each job on its own line, with sizes or brands if you know them. For example:\n· Hang 3 floating shelves in the lounge (plasterboard wall)\n· Front door sticks in the frame\n· Replace the washer in the laundry tap'
            }
            className="field"
          />
        </div>
      </Section>

      <Section legend="Size & timing">
        <div>
          <span className="label">How big is it?</span>
          <div className="grid gap-2 sm:grid-cols-2">
            {JOB_SIZES.map((size) => (
              <label
                key={size.value}
                className="flex cursor-pointer items-start gap-3 border-[3px] border-ink bg-canvas p-3 text-sm has-[:checked]:bg-mustard"
              >
                <input
                  type="radio"
                  name="jobSize"
                  value={size.value}
                  defaultChecked={size.value === defaultSize}
                  required
                  className="mt-0.5 h-4 w-4 accent-oxide"
                />
                <span>
                  <strong className="font-sign uppercase tracking-wide">{size.label}</strong>
                  <span className="mt-0.5 block text-ink-mute">{size.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="urgency">
              When do you need it?
            </label>
            <select id="urgency" name="urgency" required defaultValue="THIS_WEEK" className="field">
              {JOB_URGENCIES.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label} — {u.hint}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="preferredDate">
              Preferred date <span className="font-normal normal-case text-ink-mute">(optional)</span>
            </label>
            <input id="preferredDate" name="preferredDate" type="date" className="field" />
          </div>
        </div>
      </Section>

      <Section legend="Budget" hint="A range is fine. It stops tradies quoting on a different job to the one you want.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="budgetMin">
              From (AUD)
            </label>
            <input id="budgetMin" name="budgetMin" type="number" min={0} step="any" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="budgetMax">
              Up to (AUD)
            </label>
            <input id="budgetMax" name="budgetMax" type="number" min={0} step="any" className="field" />
          </div>
        </div>
      </Section>

      <Section legend="Where">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="address">
              Street address <span className="font-normal normal-case text-ink-mute">(only shown to the tradie you hire)</span>
            </label>
            <input id="address" name="address" className="field" />
          </div>
          <div>
            <label className="label" htmlFor="suburb">
              Suburb
            </label>
            <input id="suburb" name="suburb" required className="field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="state">
                State
              </label>
              <select id="state" name="state" required className="field">
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
              <input id="postcode" name="postcode" required maxLength={4} inputMode="numeric" className="field" />
            </div>
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 border-[3px] border-ink bg-manila p-3">
          <input type="checkbox" name="preferHomegirl" className="mt-1 h-4 w-4 accent-oxide" />
          <span className="text-sm">
            <strong className="font-sign uppercase tracking-wide">
              I&apos;d prefer a woman tradesperson
            </strong>
            <span className="mt-0.5 block text-ink-soft">
              Sends this job only to members of our Homegirls network.
            </span>
          </span>
        </label>
      </Section>

      <SubmitButton className="btn-primary w-full" pendingLabel="Posting…">
        Post the job — free
      </SubmitButton>
      <p className="text-center text-xs text-ink-mute">
        Your address and phone number stay hidden until you accept a quote.
      </p>
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
