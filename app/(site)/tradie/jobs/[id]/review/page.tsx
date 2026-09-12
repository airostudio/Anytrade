import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import ReviewForm from '@/components/ReviewForm'
import { Panel, Stamp } from '@/components/ui'
import { getJob } from '@/lib/repos/jobs'
import { getBid } from '@/lib/repos/bids'
import { hasReviewed } from '@/lib/repos/reviews'
import { money } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function RateClientPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return null

  const job = await getJob(params.id)
  if (!job) notFound()

  const bid = job.accepted_bid_id ? await getBid(job.accepted_bid_id) : null
  if (!bid || bid.user_id !== session.user.id) notFound()

  if (job.status !== 'COMPLETED') {
    return (
      <Panel className="mx-auto max-w-xl p-7">
        <h1 className="font-display text-2xl">Not signed off yet</h1>
        <p className="mt-3 text-ink-soft">
          You can rate the customer once they mark the job complete. Give them a nudge if the work is
          finished.
        </p>
        <Link href="/tradie/jobs" className="btn-primary mt-5">
          Back to my jobs
        </Link>
      </Panel>
    )
  }

  if (await hasReviewed(job.id, session.user.id, 'TRADIE_TO_CLIENT')) {
    redirect('/tradie/jobs')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/tradie/jobs" className="text-sm text-ink-mute underline-offset-4 hover:underline">
        ← Back to my jobs
      </Link>

      <div className="my-6">
        <Stamp tone="oxide" className="mb-4 bg-canvas">
          Rate the customer
        </Stamp>
        <h1 className="font-display text-3xl leading-tight">How was {job.client_name} to work for?</h1>
        <p className="mt-2 text-ink-soft">
          {job.title} · {money(bid.amount)} · reference{' '}
          <span className="font-mono">{job.reference}</span>
        </p>
        <p className="mt-2 text-sm text-ink-mute">
          Other tradies see this rating when the customer posts their next job.
        </p>
      </div>

      <Panel className="p-7">
        <ReviewForm jobId={job.id} direction="TRADIE_TO_CLIENT" subjectName={job.client_name} />
      </Panel>
    </div>
  )
}
