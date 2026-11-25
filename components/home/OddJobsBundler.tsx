'use client'

import { useMemo, useState } from 'react'
import { Check, ListChecks } from 'lucide-react'
import { ODD_JOBS, range } from '@/lib/price-guide'
import { btnPrimary } from './ui'
import { usePostJob } from './PostJobProvider'

const START_TICKED = ['tap', 'tv', 'door']

/**
 * Tick the small jobs that have piled up and send them as one visit.
 * The list becomes the job description in the Post-a-Job dialog.
 */
export default function OddJobsBundler() {
  const { open } = usePostJob()
  const [picked, setPicked] = useState<string[]>(START_TICKED)

  const chosen = useMemo(() => ODD_JOBS.filter((j) => picked.includes(j.id)), [picked])
  const from = chosen.reduce((sum, j) => sum + j.from, 0)
  const to = chosen.reduce((sum, j) => sum + j.to, 0)
  const n = chosen.length

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  function post() {
    if (n === 0) return
    const description = chosen.map((j) => `- ${j.label} (${j.detail.toLowerCase()})`).join('\n')
    open({
      category: 'handyman',
      description,
      size: n >= 5 ? 'FULL_DAY' : n >= 3 ? 'HALF_DAY' : 'ODD_JOB',
    })
  }

  return (
    <div className="grid overflow-hidden rounded-2xl border border-hairline bg-white shadow-card lg:grid-cols-[1.4fr_1fr]">
      <fieldset className="p-5 sm:p-7">
        <legend className="sr-only">Choose the odd jobs to bundle</legend>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ODD_JOBS.map((job) => {
            const on = picked.includes(job.id)
            return (
              <li key={job.id}>
                <label
                  className={`flex h-full cursor-pointer items-start gap-3 rounded-xl border p-4 transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-terracotta ${
                    on
                      ? 'border-charcoal bg-alabaster shadow-[inset_0_0_0_1px_#18181B]'
                      : 'border-charcoal/15 hover:border-charcoal/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(job.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      on ? 'border-terracotta bg-terracotta text-charcoal' : 'border-charcoal/30 bg-white'
                    }`}
                  >
                    {on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-semibold text-charcoal">{job.label}</span>
                    <span className="mt-0.5 block text-sm text-charcoal-mute">{job.detail}</span>
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <div className="flex flex-col justify-between gap-6 border-t border-hairline bg-alabaster p-6 sm:p-7 lg:border-l lg:border-t-0">
        <div aria-live="polite">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-charcoal-mute">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
            Your bundle
          </div>
          {n === 0 ? (
            <p className="mt-4 text-[17px] leading-relaxed text-charcoal-mute">
              Tick two or three jobs and we will send them as one visit, so you pay for one trip, not
              several.
            </p>
          ) : (
            <>
              <p className="mt-3 font-heritage text-4xl font-semibold tracking-tight tabular-nums">
                {range(from, to)}
              </p>
              <p className="mt-1 text-sm text-charcoal-mute">
                Guide price for {n} {n === 1 ? 'job' : 'jobs'}, GST included
              </p>
              <ul className="mt-4 space-y-1.5 text-[15px]">
                {chosen.map((j) => (
                  <li key={j.id} className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-charcoal" strokeWidth={2.5} aria-hidden="true" />
                    {j.label}
                  </li>
                ))}
              </ul>
              {n === 1 ? (
                <p className="mt-4 rounded-lg bg-terracotta-tint px-3 py-2 text-sm text-charcoal">
                  Add another job and a tradie can handle both in one visit.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div>
          <button type="button" className={`${btnPrimary} w-full`} onClick={post} disabled={n === 0}>
            {n === 0 ? 'Pick a job to bundle' : `Bundle & Post These ${n} ${n === 1 ? 'Job' : 'Jobs'}`}
          </button>
          <p className="mt-3 text-center text-sm text-charcoal-mute">
            Free to post. Compare quotes before you commit.
          </p>
        </div>
      </div>
    </div>
  )
}
