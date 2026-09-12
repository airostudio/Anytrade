'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { declineBid, getBid, placeBid, shortlistBid, withdrawBid } from '@/lib/repos/bids'
import { getJob } from '@/lib/repos/jobs'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { notify } from '@/lib/repos/notifications'
import { recordAudit } from '@/lib/repos/admin'
import { BID_CREDIT_COST } from '@/lib/constants'
import type { ActionState } from './auth'

const bidSchema = z.object({
  jobId: z.string().min(1),
  amount: z.coerce.number().positive('Put a real number in the quote.').max(500000),
  message: z.string().min(20, 'Write at least a line or two for the customer.').max(3000),
  estimatedDays: z.coerce.number().int().min(0).max(365).optional(),
  estimatedHours: z.coerce.number().min(0).max(2000).optional(),
  includesMaterials: z.coerce.boolean().optional(),
  includesGst: z.coerce.boolean().optional(),
  availableFrom: z.string().optional(),
  warrantyMonths: z.coerce.number().int().min(0).max(240).optional(),
})

export async function submitBid(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') {
    return { error: 'Only tradie accounts can quote on jobs.' }
  }

  const parsed = bidSchema.safeParse({
    ...Object.fromEntries(formData),
    includesMaterials: formData.get('includesMaterials') === 'on',
    includesGst: formData.get('includesGst') === 'on',
  })
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  const data = parsed.data

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Your tradie profile is missing. Contact support.' }

  const job = await getJob(data.jobId)
  if (!job) return { error: 'That job no longer exists.' }
  if (job.prefer_homegirl && !tradie.is_homegirl) {
    return { error: 'This customer asked for a Homegirls member.' }
  }

  const cost = BID_CREDIT_COST[job.job_size] ?? 1
  const result = await placeBid({
    jobId: data.jobId,
    tradespersonId: tradie.id,
    userId: session.user.id,
    amount: data.amount,
    message: data.message,
    estimatedDays: data.estimatedDays ?? null,
    estimatedHours: data.estimatedHours ?? null,
    includesMaterials: Boolean(data.includesMaterials),
    includesGst: data.includesGst ?? true,
    availableFrom: data.availableFrom || null,
    warrantyMonths: data.warrantyMonths ?? null,
    creditsSpent: cost,
  })

  if (!result.ok) return { error: result.error }

  await notify({
    userId: job.client_id,
    title: 'New quote received',
    body: `${tradie.business_name} quoted on ${job.title}.`,
    link: `/dashboard/jobs/${job.id}`,
    kind: 'bid',
  })
  await recordAudit({
    actorId: session.user.id,
    action: 'bid.placed',
    entityType: 'bid',
    entityId: result.bid.id,
    detail: `${job.reference} — $${data.amount}`,
  })

  revalidatePath('/tradie/bids')
  revalidatePath('/tradie/leads')
  redirect('/tradie/bids?quoted=1')
}

export async function toggleShortlist(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const bidId = String(formData.get('bidId'))
  const shortlisted = formData.get('shortlisted') === 'true'

  const bid = await getBid(bidId)
  if (!bid) return
  const job = await getJob(bid.job_id)
  if (!job || job.client_id !== session.user.id) return

  await shortlistBid(bidId, shortlisted)
  if (shortlisted) {
    await notify({
      userId: bid.user_id,
      title: 'You have been shortlisted',
      body: `${job.client_name} shortlisted your quote on ${job.title}.`,
      link: '/tradie/bids',
      kind: 'bid',
    })
  }
  revalidatePath(`/dashboard/jobs/${bid.job_id}`)
}

export async function rejectBid(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const bidId = String(formData.get('bidId'))
  const bid = await getBid(bidId)
  if (!bid) return
  const job = await getJob(bid.job_id)
  if (!job || job.client_id !== session.user.id) return

  await declineBid(bidId)
  revalidatePath(`/dashboard/jobs/${bid.job_id}`)
}

export async function withdrawOwnBid(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') return

  const bidId = String(formData.get('bidId'))
  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return

  await withdrawBid(bidId, tradie.id)
  revalidatePath('/tradie/bids')
}
