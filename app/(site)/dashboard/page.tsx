import Link from 'next/link'
import { auth } from '@/lib/auth'
import JobCard from '@/components/JobCard'
import { EmptyState, Panel, SectionHeading, StatTile } from '@/components/ui'
import { jobsForClient } from '@/lib/repos/jobs'
import { pendingReviewsFor } from '@/lib/repos/reviews'
import { listNotifications } from '@/lib/repos/notifications'
import { getUser } from '@/lib/repos/users'
import { timeAgo, rating1dp } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ClientDashboard({
  searchParams,
}: {
  searchParams: { rated?: string }
}) {
  const session = await auth()
  if (!session?.user) return null

  const [jobs, pendingRatings, notifications, me] = await Promise.all([
    jobsForClient(session.user.id, 100),
    pendingReviewsFor(session.user.id, 'CLIENT'),
    listNotifications(session.user.id, 6),
    getUser(session.user.id),
  ])

  const live = jobs.filter((j) => ['OPEN', 'SHORTLISTING', 'AWARDED', 'IN_PROGRESS'].includes(j.status))
  const done = jobs.filter((j) => j.status === 'COMPLETED')
  const quotesIn = live.reduce((sum, j) => sum + j.bid_count, 0)

  return (
    <div className="space-y-10">
      {searchParams.rated ? (
        <Panel tone="mustard" className="p-4">
          <p className="font-sign font-bold uppercase tracking-wide">
            Thanks — your rating is published.
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Live jobs" value={live.length} tone="safety" />
        <StatTile label="Quotes received" value={quotesIn} tone="navy" />
        <StatTile label="Jobs completed" value={done.length} tone="bottle" />
        <StatTile
          label="Your rating"
          value={me?.client_review_count ? rating1dp(me.client_rating) : '—'}
          hint={me?.client_review_count ? `${me.client_review_count} tradies rated you` : 'Tradies rate you after each job'}
          tone="mustard"
        />
      </div>

      {pendingRatings.length ? (
        <section>
          <SectionHeading
            eyebrow="Over to you"
            title="Rate your tradie"
            blurb="These jobs are signed off. A rating takes ten seconds and it is what keeps the directory honest."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingRatings.map((item) => (
              <Panel key={item.job_id} tone="mustard" className="p-5">
                <p className="font-mono text-xs text-ink-mute">{item.reference}</p>
                <h3 className="mt-1 font-sign text-lg font-bold uppercase leading-tight">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-ink-soft">Completed by {item.other_name}</p>
                <Link href={`/dashboard/jobs/${item.job_id}/review`} className="btn-oxide btn-sm mt-4 w-full">
                  Rate this job
                </Link>
              </Panel>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <SectionHeading
          eyebrow="On the go"
          title="Your jobs"
          action={
            <Link href="/post-a-job" className="btn-primary btn-sm">
              Post another job
            </Link>
          }
        />

        {live.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {live.map((job) => (
              <JobCard key={job.id} job={job} href={`/dashboard/jobs/${job.id}`} showStatus cta="Manage quotes" />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="📋"
            title="Nothing on the go"
            blurb="Post a job and local tradies will start quoting, usually within a few hours."
            action={
              <Link href="/post-a-job" className="btn-primary">
                Post your first job
              </Link>
            }
          />
        )}
      </section>

      {done.length ? (
        <section>
          <SectionHeading eyebrow="History" title="Finished jobs" />
          <Panel className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b-[3px] border-ink bg-canvas-deep text-left font-sign text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Suburb</th>
                  <th className="px-4 py-3">Completed</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {done.map((job) => (
                  <tr key={job.id} className="border-b border-dashed border-ink/20">
                    <td className="px-4 py-3 font-mono text-xs">{job.reference}</td>
                    <td className="px-4 py-3 font-semibold">{job.title}</td>
                    <td className="px-4 py-3 text-ink-soft">{job.suburb}</td>
                    <td className="px-4 py-3 text-ink-soft">{timeAgo(job.completed_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/dashboard/jobs/${job.id}`} className="btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </section>
      ) : null}

      {notifications.length ? (
        <section>
          <SectionHeading eyebrow="Latest" title="What's happened" />
          <Panel className="divide-y-2 divide-dashed divide-ink/20">
            {notifications.map((note) => (
              <div key={note.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="font-sign text-sm font-bold uppercase tracking-wide">{note.title}</p>
                  {note.body ? <p className="mt-0.5 text-sm text-ink-soft">{note.body}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-ink-mute">{timeAgo(note.created_at)}</span>
                  {note.link ? (
                    <Link href={note.link} className="btn-ghost btn-sm">
                      Open
                    </Link>
                  ) : null}
                </div>
              </div>
            ))}
          </Panel>
        </section>
      ) : null}
    </div>
  )
}
