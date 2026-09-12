'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { awardJob, completeJob, createJob, getJob, updateJobStatus } from '@/lib/repos/jobs'
import { getBid, markBidsSeen } from '@/lib/repos/bids'
import { notify } from '@/lib/repos/notifications'
import { recordAudit } from '@/lib/repos/admin'
import { getSettings } from '@/lib/repos/settings'
import type { ActionState } from './auth'

const jobSchema = z.object({
  title: z.string().min(6, 'Give the job a short title.').max(120),
  description: z.string().min(20, 'Tell the tradies a bit more — at least 20 characters.').max(4000),
  category: z.string().min(1, 'Pick a trade.'),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  jobSize: z.enum(['ODD_JOB', 'HALF_DAY', 'FULL_DAY', 'MULTI_DAY', 'LARGE_PROJECT']),
  urgency: z.enum(['EMERGENCY', 'THIS_WEEK', 'NEXT_FORTNIGHT', 'FLEXIBLE']),
  address: z.string().optional(),
  suburb: z.string().min(2, 'Which suburb?'),
  city: z.string().optional(),
  state: z.string().min(2, 'Which state?'),
  postcode: z.string().min(3, 'Postcode, please.').max(4),
  preferredDate: z.string().optional(),
  preferHomegirl: z.coerce.boolean().optional(),
})

export async function postJob(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: 'Please sign in to post a job.' }
  if (session.user.role !== 'CLIENT') {
    return { error: 'Only homeowner accounts can post jobs.' }
  }

  const parsed = jobSchema.safeParse({
    ...Object.fromEntries(formData),
    preferHomegirl: formData.get('preferHomegirl') === 'on',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  const data = parsed.data

  if (data.budgetMin && data.budgetMax && data.budgetMin > data.budgetMax) {
    return { error: 'The minimum budget is higher than the maximum.' }
  }

  let jobId: string
  try {
    const settings = await getSettings()
    const job = await createJob({
      clientId: session.user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      jobSize: data.jobSize,
      urgency: data.urgency,
      address: data.address ?? null,
      suburb: data.suburb,
      city: data.city || data.suburb,
      state: data.state,
      postcode: data.postcode,
      preferredDate: data.preferredDate || null,
      preferHomegirl: Boolean(data.preferHomegirl),
      maxBids: Number(settings['bidding.max_bids_default'] ?? 6),
      bidWindowDays: Number(settings['bidding.bid_window_days'] ?? 14),
    })
    jobId = job.id

    await recordAudit({
      actorId: session.user.id,
      action: 'job.posted',
      entityType: 'job',
      entityId: job.id,
      detail: `${job.reference} — ${job.title}`,
    })
  } catch (error) {
    console.error('[jobs] post failed', error)
    return { error: 'Could not post the job. Please try again.' }
  }

  revalidatePath('/dashboard')
  redirect(`/dashboard/jobs/${jobId}?posted=1`)
}

/** Client accepts one quote; every other live quote is declined. */
export async function acceptBid(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const jobId = String(formData.get('jobId'))
  const bidId = String(formData.get('bidId'))

  const job = await getJob(jobId)
  if (!job || job.client_id !== session.user.id) return
  if (!['OPEN', 'SHORTLISTING'].includes(job.status)) return

  const bid = await getBid(bidId)
  if (!bid || bid.job_id !== jobId) return

  await awardJob(jobId, bidId)
  await notify({
    userId: bid.user_id,
    title: 'Your quote was accepted',
    body: `${job.client_name} accepted your quote on ${job.title}.`,
    link: `/tradie/jobs`,
    kind: 'bid',
  })
  await recordAudit({
    actorId: session.user.id,
    action: 'job.awarded',
    entityType: 'job',
    entityId: jobId,
    detail: `Bid ${bidId} accepted`,
  })

  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard')
}

export async function startJob(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  const jobId = String(formData.get('jobId'))

  const job = await getJob(jobId)
  if (!job) return
  const isClient = job.client_id === session.user.id
  if (!isClient && session.user.role !== 'ADMIN') return

  await updateJobStatus(jobId, 'IN_PROGRESS')
  revalidatePath(`/dashboard/jobs/${jobId}`)
}

/** Client signs the job off — this is what unlocks the two-way ratings. */
export async function markJobComplete(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  const jobId = String(formData.get('jobId'))

  const job = await getJob(jobId)
  if (!job) return
  if (job.client_id !== session.user.id && session.user.role !== 'ADMIN') return
  if (!['AWARDED', 'IN_PROGRESS'].includes(job.status)) return

  await completeJob(jobId)

  const bid = job.accepted_bid_id ? await getBid(job.accepted_bid_id) : null
  if (bid) {
    await notify({
      userId: bid.user_id,
      title: 'Job signed off',
      body: `${job.title} is marked complete. Rate the customer to finish up.`,
      link: `/tradie/jobs/${jobId}/review`,
      kind: 'review',
    })
  }

  await recordAudit({
    actorId: session.user.id,
    action: 'job.completed',
    entityType: 'job',
    entityId: jobId,
    detail: job.reference,
  })

  revalidatePath(`/dashboard/jobs/${jobId}`)
  redirect(`/dashboard/jobs/${jobId}/review`)
}

export async function cancelJob(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return
  const jobId = String(formData.get('jobId'))
  const reason = String(formData.get('reason') ?? '')

  const job = await getJob(jobId)
  if (!job) return
  if (job.client_id !== session.user.id && session.user.role !== 'ADMIN') return

  await updateJobStatus(jobId, 'CANCELLED', { cancelReason: reason })
  await recordAudit({
    actorId: session.user.id,
    action: 'job.cancelled',
    entityType: 'job',
    entityId: jobId,
    detail: reason,
  })
  revalidatePath(`/dashboard/jobs/${jobId}`)
  revalidatePath('/dashboard')
}

/** Called when the client opens the bid list, so tradies can see it landed. */
export async function markQuotesSeen(jobId: string): Promise<void> {
  await markBidsSeen(jobId)
}
