import Link from 'next/link'
import { Panel, Pill, SectionHeading, StatTile } from '@/components/ui'
import { listAllJobs } from '@/lib/repos/jobs'
import { platformStats } from '@/lib/repos/admin'
import { adminSetJobStatus } from '@/app/actions/admin'
import { categoryName } from '@/lib/constants'
import {
  budgetRange,
  JOB_SIZE_LABEL,
  JOB_STATUS_LABEL,
  jobStatusTone,
  timeAgo,
} from '@/lib/utils'
import type { JobStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUSES: JobStatus[] = [
  'OPEN',
  'SHORTLISTING',
  'AWARDED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED',
]

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const [all, stats] = await Promise.all([listAllJobs(300), platformStats()])
  const jobs = searchParams.status ? all.filter((j) => j.status === searchParams.status) : all

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Demand side" title="Jobs" blurb="Every job posted on the platform." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="All jobs" value={stats.jobs.total} />
        <StatTile label="Open" value={stats.jobs.open} tone="bottle" />
        <StatTile label="In progress" value={stats.jobs.awarded + stats.jobs.inProgress} tone="safety" />
        <StatTile label="Completed" value={stats.jobs.completed} tone="navy" />
        <StatTile label="Handyman / odd jobs" value={stats.jobs.handyman} tone="mustard" />
      </div>

      <Panel className="p-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/jobs"
            className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
              !searchParams.status ? 'bg-safety' : 'bg-canvas'
            }`}
          >
            All ({all.length})
          </Link>
          {STATUSES.map((status) => (
            <Link
              key={status}
              href={`/admin/jobs?status=${status}`}
              className={`btn-sm border-2 border-ink font-sign uppercase tracking-widest ${
                searchParams.status === status ? 'bg-safety' : 'bg-canvas'
              }`}
            >
              {JOB_STATUS_LABEL[status]} ({all.filter((j) => j.status === status).length})
            </Link>
          ))}
        </div>
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Trade</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Quotes</th>
              <th className="px-4 py-3">Posted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-dashed border-ink/20">
                <td className="px-4 py-3 font-mono text-xs">{job.reference}</td>
                <td className="px-4 py-3">
                  <span className="font-semibold">{job.title}</span>
                  <span className="block text-xs text-ink-mute">
                    {job.suburb}, {job.state} · {JOB_SIZE_LABEL[job.job_size]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span>{job.client_name}</span>
                  <span className="block font-mono text-xs text-ink-mute">{job.client_email}</span>
                </td>
                <td className="px-4 py-3 text-ink-soft">{categoryName(job.category)}</td>
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs">
                  {budgetRange(job.budget_min, job.budget_max)}
                </td>
                <td className="px-4 py-3 font-mono">
                  {job.bid_count}/{job.max_bids}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-mute">{timeAgo(job.created_at)}</td>
                <td className="px-4 py-3">
                  <Pill className={jobStatusTone(job.status)}>{JOB_STATUS_LABEL[job.status]}</Pill>
                </td>
                <td className="px-4 py-3">
                  <form action={adminSetJobStatus} className="flex gap-1.5">
                    <input type="hidden" name="jobId" value={job.id} />
                    <select name="status" defaultValue={job.status} className="border-2 border-ink px-1.5 py-1 text-xs">
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {JOB_STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="border-2 border-ink px-2 py-1 font-sign text-[11px] font-bold uppercase hover:bg-safety"
                    >
                      Set
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!jobs.length ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-ink-mute">
                  No jobs match that filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}
