'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { POPULAR_SUBURBS, TRADE_CATEGORIES } from '@/lib/constants'
import { ODD_JOBS } from '@/lib/price-guide'
import { describeWhat, parseLocation } from './post-job-shared'
import { usePostJob } from './PostJobProvider'
import { btnPrimary } from './ui'

/** The 2-step Job Quick-Start: pick the job, say where, get quotes. */
export default function QuickStart() {
  const { open } = usePostJob()
  const [what, setWhat] = useState('')
  const [where, setWhere] = useState('')
  const [errors, setErrors] = useState<{ what?: string; where?: string }>({})

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const next: typeof errors = {}
    if (!what) next.what = 'Choose what you need done.'
    if (!where.trim()) next.where = 'Add your suburb or postcode.'
    setErrors(next)
    if (next.what || next.where) return

    open({ ...describeWhat(what), ...parseLocation(where) })
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-label="Job quick start"
      className="rounded-2xl border border-hairline bg-white p-3 shadow-lift sm:p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="qs-what" className="mb-1.5 flex items-center gap-2 px-1 text-sm font-semibold">
            <StepDot n={1} />
            What do you need done?
          </label>
          <select
            id="qs-what"
            value={what}
            onChange={(e) => {
              setWhat(e.target.value)
              setErrors((x) => ({ ...x, what: undefined }))
            }}
            aria-invalid={Boolean(errors.what)}
            aria-describedby={errors.what ? 'qs-what-err' : undefined}
            className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3.5 text-base transition hover:border-charcoal/40 focus:border-charcoal focus:outline-none"
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
          {errors.what ? (
            <p id="qs-what-err" role="alert" className="mt-1.5 px-1 text-sm font-medium text-terracotta-deep">
              {errors.what}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="qs-where" className="mb-1.5 flex items-center gap-2 px-1 text-sm font-semibold">
            <StepDot n={2} />
            Where is the job?
          </label>
          <input
            id="qs-where"
            list="qs-suburbs"
            autoComplete="off"
            value={where}
            onChange={(e) => {
              setWhere(e.target.value)
              setErrors((x) => ({ ...x, where: undefined }))
            }}
            placeholder="Suburb or postcode"
            aria-invalid={Boolean(errors.where)}
            aria-describedby={errors.where ? 'qs-where-err' : undefined}
            className="w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3.5 text-base placeholder:text-charcoal-mute/70 transition hover:border-charcoal/40 focus:border-charcoal focus:outline-none"
          />
          <datalist id="qs-suburbs">
            {POPULAR_SUBURBS.map((s) => (
              <option key={s.postcode} value={`${s.suburb} ${s.state} ${s.postcode}`} />
            ))}
          </datalist>
          {errors.where ? (
            <p id="qs-where-err" role="alert" className="mt-1.5 px-1 text-sm font-medium text-terracotta-deep">
              {errors.where}
            </p>
          ) : null}
        </div>

        <button type="submit" className={`${btnPrimary} w-full sm:col-span-2`}>
          Get Free Quotes
          <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

function StepDot({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-charcoal text-xs font-bold text-white"
    >
      {n}
    </span>
  )
}
