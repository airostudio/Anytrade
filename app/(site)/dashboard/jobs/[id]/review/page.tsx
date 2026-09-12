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

export default async function RateTradiePage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return null

  const job = await getJob(params.id)
  if (!job || job.client_id !== session.user.id) notFound()

  if (job.status !== 'COMPLETED') {
    return (
      <Panel className="mx-auto max-w-xl p-7">
        <h1 className="font-display text-2xl">Not finished yet</h1>
        <p className="mt-3 text-ink-soft">
          You can rate a tradie once the job is signed off. Head back and mark it complete when the
          work is done.
        </p>
        <Link href={`/dashboard/jobs/${job.id}`} className="btn-primary mt-5">
          Back to the job
        </Link>
      </Panel>
    )
  }

  if (await hasReviewed(job.id, session.user.id, 'CLIENT_TO_TRADIE')) {
    redirect(`/dashboard/jobs/${job.id}`)
  }

  const bid = job.accepted_bid_id ? await getBid(job.accepted_bid_id) : null
  if (!bid) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/dashboard/jobs/${job.id}`} className="text-sm text-ink-mute underline-offset-4 hover:underline">
        ← Back to the job
      </Link>

      <div className="my-6">
        <Stamp tone="oxide" className="mb-4 bg-canvas">
          Ten seconds, honest answer
        </Stamp>
        <h1 className="font-display text-3xl leading-tight">How did {bid.business_name} go?</h1>
        <p className="mt-2 text-ink-soft">
          {job.title} · {money(bid.amount)} · reference{' '}
          <span className="font-mono">{job.reference}</span>
        </p>
      </div>

      <Panel className="p-7">
        <ReviewForm jobId={job.id} direction="CLIENT_TO_TRADIE" subjectName={bid.business_name} />
      </Panel>
    </div>
  )
}
