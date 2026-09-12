import Link from 'next/link'
import { Pill } from './ui'
import { categoryName } from '@/lib/constants'
import { budgetRange, JOB_SIZE_LABEL, JOB_URGENCY_LABEL, jobStatusTone, JOB_STATUS_LABEL, timeAgo, truncate } from '@/lib/utils'
import type { JobWithClient } from '@/lib/types'

export default function JobCard({
  job,
  href,
  showStatus = false,
  cta = 'View job',
}: {
  job: JobWithClient
  href: string
  showStatus?: boolean
  cta?: string
}) {
  const slotsLeft = Math.max(0, job.max_bids - job.bid_count)

  return (
    <article className="flex h-full flex-col border-[3px] border-ink bg-canvas shadow-hard card-lift">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-ink/20 bg-canvas-deep px-4 py-2">
        <span className="font-mono text-xs font-bold tracking-wider text-ink-mute">{job.reference}</span>
        <div className="flex flex-wrap items-center gap-1.5">
          {job.urgency === 'EMERGENCY' ? (
            <Pill className="border-ink bg-oxide text-canvas">Emergency</Pill>
          ) : null}
          {job.prefer_homegirl ? (
            <Pill className="border-oxide bg-canvas text-oxide">Homegirl requested</Pill>
          ) : null}
          {showStatus ? (
            <Pill className={jobStatusTone(job.status)}>{JOB_STATUS_LABEL[job.status]}</Pill>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-sign text-lg font-bold uppercase leading-tight text-ink">
            <Link href={href} className="hover:text-oxide">
              {job.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-ink-mute">
            {categoryName(job.category)} · {job.suburb}, {job.state} {job.postcode}
          </p>
        </div>

        <p className="text-sm text-ink-soft">{truncate(job.description, 150)}</p>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-y-2 border-dashed border-ink/25 py-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">Budget</dt>
            <dd className="font-bold text-ink">{budgetRange(job.budget_min, job.budget_max)}</dd>
          </div>
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">Size</dt>
            <dd className="font-bold text-ink">{JOB_SIZE_LABEL[job.job_size]}</dd>
          </div>
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">Timing</dt>
            <dd className="font-bold text-ink">{JOB_URGENCY_LABEL[job.urgency]}</dd>
          </div>
          <div>
            <dt className="font-sign text-[10px] uppercase tracking-widest text-ink-mute">Quotes</dt>
            <dd className="font-bold text-ink">
              {job.bid_count}/{job.max_bids}
              {slotsLeft > 0 && slotsLeft <= 2 ? (
                <span className="ml-1 text-xs text-oxide">({slotsLeft} left)</span>
              ) : null}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3">
          <span className="text-xs text-ink-mute">Posted {timeAgo(job.created_at)}</span>
          <Link href={href} className="btn-primary btn-sm">
            {cta}
          </Link>
        </div>
      </div>
    </article>
  )
}
