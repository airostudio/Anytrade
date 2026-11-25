'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Heart, MapPin, X } from 'lucide-react'
import { POPULAR_SUBURBS, TRADE_CATEGORIES } from '@/lib/constants'
import { ODD_JOBS } from '@/lib/price-guide'
import { stateFromPostcode } from '@/lib/trust'
import {
  DRAFT_SIZES,
  JOB_URGENCIES,
  MIN_DESCRIPTION,
  describeWhat,
  locationLabel,
  parseLocation,
  postJobUrl,
  tradeName,
  whatValue,
  type JobDraft,
} from './post-job-shared'
import { btnGhost, btnPrimary, btnSecondary, fieldCls } from './ui'

type Step = 1 | 2 | 3
const STEP_TITLES: Record<Step, string> = {
  1: 'What and where',
  2: 'The details',
  3: 'Check and send',
}

export default function PostJobModal({
  initial,
  initialStep,
  onClose,
}: {
  initial: JobDraft
  initialStep: Step
  onClose: () => void
}) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [step, setStep] = useState<Step>(initialStep)
  const [draft, setDraft] = useState<JobDraft>(initial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)

  const set = <K extends keyof JobDraft>(key: K, value: JobDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  // Open as a real modal dialog: focus trap, Escape to close and inert background come free.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
    }
  }, [])

  // Move focus to the first field whenever the step changes.
  useEffect(() => {
    dialogRef.current
      ?.querySelector<HTMLElement>('[data-autofocus]')
      ?.focus({ preventScroll: true })
  }, [step])

  function validate(forStep: Step): boolean {
    const next: Record<string, string> = {}
    if (forStep === 1) {
      if (!draft.category) next.category = 'Pick the trade or the odd job you need.'
      if (!draft.suburb.trim()) next.suburb = 'Which suburb is the job in?'
      if (!/^\d{4}$/.test(draft.postcode)) next.postcode = 'Enter the 4-digit postcode.'
      else if (!draft.state) next.postcode = 'We do not recognise that postcode.'
    }
    if (forStep === 2) {
      if (draft.description.trim().length < MIN_DESCRIPTION) {
        next.description = `Add a little more detail (at least ${MIN_DESCRIPTION} characters) so tradies can quote accurately.`
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function go(to: Step) {
    if (to > step && !validate(step)) return
    setErrors({})
    setStep(to)
  }

  function submit() {
    if (!validate(1) || !validate(2)) return
    setSending(true)
    router.push(postJobUrl(draft))
  }

  function onLocationInput(value: string) {
    // Picking a suggestion ("Parramatta NSW 2150") fills suburb, state and postcode together.
    if (/\b\d{4}\b/.test(value) && /[A-Za-z]/.test(value)) {
      setDraft((d) => ({ ...d, ...parseLocation(value) }))
    } else {
      set('suburb', value)
    }
  }

  function onPostcodeInput(value: string) {
    const postcode = value.replace(/\D/g, '').slice(0, 4)
    setDraft((d) => {
      const known = POPULAR_SUBURBS.find((s) => s.postcode === postcode)
      return {
        ...d,
        postcode,
        state: stateFromPostcode(postcode) ?? '',
        suburb: d.suburb || known?.suburb || '',
      }
    })
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) dialogRef.current?.close()
      }}
      className="m-auto w-[calc(100%-1.5rem)] max-w-xl rounded-2xl border-0 bg-white p-0 text-charcoal shadow-lift backdrop:bg-charcoal/60 backdrop:backdrop-blur-[2px] open:animate-fade-in"
    >
      <div className="flex max-h-[min(90vh,46rem)] flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-hairline px-6 pb-4 pt-5">
          <div>
            <p className="text-sm font-semibold text-terracotta-deep">
              Step {step} of 3 · {STEP_TITLES[step]}
            </p>
            <h2 id={titleId} className="mt-1 font-heritage text-2xl font-semibold tracking-tight">
              Get free quotes
            </h2>
            <div className="mt-3 flex gap-1.5" aria-hidden="true">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={`h-1.5 w-12 rounded-full transition-colors ${n <= step ? 'bg-terracotta' : 'bg-charcoal/10'}`}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-lg p-2 text-charcoal-mute transition hover:bg-charcoal/5 hover:text-charcoal"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          {step === 1 ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="pj-what" className="mb-1.5 block text-sm font-semibold">
                  What do you need done?
                </label>
                <select
                  id="pj-what"
                  data-autofocus
                  value={whatValue(draft)}
                  onChange={(e) => setDraft((d) => ({ ...d, ...describeWhat(e.target.value) }))}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? 'pj-what-err' : undefined}
                  className={fieldCls}
                >
                  <option value="">Choose a trade or odd job</option>
                  <optgroup label="Odd jobs">
                    {ODD_JOBS.map((j) => (
                      <option key={j.id} value={`task:${j.id}`}>
                        {j.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All trades">
                    {TRADE_CATEGORIES.map((c) => (
                      <option key={c.slug} value={`trade:${c.slug}`}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <FieldError id="pj-what-err" message={errors.category} />
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
                <div>
                  <label htmlFor="pj-suburb" className="mb-1.5 block text-sm font-semibold">
                    Suburb
                  </label>
                  <input
                    id="pj-suburb"
                    list="pj-suburbs"
                    autoComplete="off"
                    value={draft.suburb}
                    onChange={(e) => onLocationInput(e.target.value)}
                    aria-invalid={Boolean(errors.suburb)}
                    aria-describedby={errors.suburb ? 'pj-suburb-err' : undefined}
                    className={fieldCls}
                    placeholder="e.g. Parramatta"
                  />
                  <datalist id="pj-suburbs">
                    {POPULAR_SUBURBS.map((s) => (
                      <option key={s.postcode} value={`${s.suburb} ${s.state} ${s.postcode}`} />
                    ))}
                  </datalist>
                  <FieldError id="pj-suburb-err" message={errors.suburb} />
                </div>
                <div>
                  <label htmlFor="pj-postcode" className="mb-1.5 block text-sm font-semibold">
                    Postcode
                  </label>
                  <input
                    id="pj-postcode"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    value={draft.postcode}
                    onChange={(e) => onPostcodeInput(e.target.value)}
                    aria-invalid={Boolean(errors.postcode)}
                    aria-describedby={errors.postcode ? 'pj-postcode-err' : undefined}
                    className={fieldCls}
                    placeholder="2150"
                  />
                  <FieldError id="pj-postcode-err" message={errors.postcode} />
                </div>
              </div>
              {draft.state ? (
                <p className="-mt-2 flex items-center gap-1.5 text-sm text-charcoal-mute">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {locationLabel(draft)}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="pj-desc" className="mb-1.5 block text-sm font-semibold">
                  Describe the job{draft.category ? ` (${tradeName(draft.category)})` : ''}
                </label>
                <textarea
                  id="pj-desc"
                  data-autofocus
                  rows={5}
                  value={draft.description}
                  onChange={(e) => set('description', e.target.value)}
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={errors.description ? 'pj-desc-err' : 'pj-desc-hint'}
                  className={fieldCls}
                  placeholder={'One job per line works best, for example:\n- Hang a 55 inch TV bracket in the lounge\n- Front door sticks at the top corner'}
                />
                {errors.description ? (
                  <FieldError id="pj-desc-err" message={errors.description} />
                ) : (
                  <p id="pj-desc-hint" className="mt-1.5 text-sm text-charcoal-mute">
                    Sizes, brands and photos later on help tradies quote closer to the final price.
                  </p>
                )}
              </div>

              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">How big is it?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {DRAFT_SIZES.map((s) => (
                    <label
                      key={s.value}
                      className={`flex cursor-pointer flex-col rounded-xl border px-3.5 py-2.5 text-sm transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                        draft.size === s.value
                          ? 'border-charcoal bg-alabaster'
                          : 'border-charcoal/20 hover:border-charcoal/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="pj-size"
                        value={s.value}
                        checked={draft.size === s.value}
                        onChange={() => set('size', s.value)}
                        className="sr-only"
                      />
                      <span className="font-semibold">{s.label}</span>
                      <span className="text-charcoal-mute">{s.hint}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div>
                <label htmlFor="pj-urgency" className="mb-1.5 block text-sm font-semibold">
                  When do you need it?
                </label>
                <select
                  id="pj-urgency"
                  value={draft.urgency}
                  onChange={(e) => set('urgency', e.target.value)}
                  className={fieldCls}
                >
                  {JOB_URGENCIES.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label} · {u.hint}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-charcoal/15 bg-alabaster p-3.5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta">
                <input
                  type="checkbox"
                  checked={draft.preferHomegirl}
                  onChange={(e) => set('preferHomegirl', e.target.checked)}
                  className="mt-1 h-4 w-4 accent-terracotta"
                />
                <span className="text-sm">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Heart className="h-4 w-4 text-terracotta-deep" aria-hidden="true" />I would prefer a
                    female tradie
                  </span>
                  <span className="mt-0.5 block text-charcoal-mute">
                    Your job goes to women in the Homegirls Network. Fewer tradies may be available in
                    some areas.
                  </span>
                </span>
              </label>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <dl className="divide-y divide-hairline rounded-xl border border-hairline text-[15px]">
                <Row label="Job" value={tradeName(draft.category)} />
                <Row label="Where" value={locationLabel(draft)} />
                <Row label="Size" value={DRAFT_SIZES.find((s) => s.value === draft.size)?.label ?? ''} />
                <Row
                  label="Timing"
                  value={JOB_URGENCIES.find((u) => u.value === draft.urgency)?.label ?? ''}
                />
                {draft.preferHomegirl ? <Row label="Tradie" value="Homegirls Network (female tradie)" /> : null}
                <div className="px-4 py-3">
                  <dt className="text-sm font-semibold text-charcoal-mute">Details</dt>
                  <dd className="mt-1 whitespace-pre-line">{draft.description}</dd>
                </div>
              </dl>
              <p className="flex items-start gap-2 text-sm text-charcoal-mute">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-charcoal" aria-hidden="true" />
                Next you sign in or create a free account. Everything you have entered comes with you, so
                there is nothing to type twice. Your address and phone number stay private until you
                accept a quote.
              </p>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-hairline bg-alabaster px-6 py-4">
          {step > 1 ? (
            <button type="button" className={btnGhost} onClick={() => go((step - 1) as Step)}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </button>
          ) : (
            <button type="button" className={btnGhost} onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
          )}
          {step < 3 ? (
            <button type="button" className={btnPrimary} onClick={() => go((step + 1) as Step)}>
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" className={`${btnSecondary} hidden sm:inline-flex`} onClick={() => go(2)}>
                Edit
              </button>
              <button type="button" className={btnPrimary} onClick={submit} disabled={sending}>
                {sending ? 'Taking you there…' : 'Send my job'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </footer>
      </div>
    </dialog>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-sm font-semibold text-charcoal-mute">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm font-medium text-terracotta-deep">
      {message}
    </p>
  )
}
