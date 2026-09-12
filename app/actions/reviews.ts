'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { createReview, hasReviewed, respondToReview } from '@/lib/repos/reviews'
import { getJob } from '@/lib/repos/jobs'
import { getBid } from '@/lib/repos/bids'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { notify } from '@/lib/repos/notifications'
import { getSettings } from '@/lib/repos/settings'
import type { ActionState } from './auth'

const reviewSchema = z.object({
  jobId: z.string().min(1),
  rating: z.coerce.number().int().min(1, 'Give a star rating.').max(5),
  comment: z.string().max(2000).optional(),
  quality: z.coerce.number().int().min(1).max(5).optional(),
  punctuality: z.coerce.number().int().min(1).max(5).optional(),
  value: z.coerce.number().int().min(1).max(5).optional(),
  communication: z.coerce.number().int().min(1).max(5).optional(),
  tidiness: z.coerce.number().int().min(1).max(5).optional(),
})

/**
 * One action serves both directions of the rideshare-style rating: the client
 * rating their tradie, and the tradie rating the customer back.
 */
export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: 'Please sign in.' }

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  const data = parsed.data
  const tags = formData.getAll('tags').map(String)

  const job = await getJob(data.jobId)
  if (!job) return { error: 'That job no longer exists.' }
  if (job.status !== 'COMPLETED') {
    return { error: 'You can only rate a job once it has been signed off.' }
  }

  const acceptedBid = job.accepted_bid_id ? await getBid(job.accepted_bid_id) : null
  if (!acceptedBid) return { error: 'This job has no accepted quote to rate against.' }

  const isClient = job.client_id === session.user.id
  const isTradie = acceptedBid.user_id === session.user.id
  if (!isClient && !isTradie) return { error: 'You were not part of this job.' }

  const direction = isClient ? 'CLIENT_TO_TRADIE' : 'TRADIE_TO_CLIENT'
  if (await hasReviewed(data.jobId, session.user.id, direction)) {
    return { error: 'You have already rated this job.' }
  }

  const settings = await getSettings()
  const minChars = Number(settings['reviews.min_chars'] ?? 20)
  const comment = data.comment?.trim() || null
  if (comment && comment.length < minChars) {
    return { error: `Please write at least ${minChars} characters, or leave the comment empty.` }
  }

  const autoPublish = settings['reviews.auto_publish'] !== 'false'

  try {
    const created = await createReview({
      jobId: data.jobId,
      direction,
      reviewerId: session.user.id,
      revieweeId: isClient ? acceptedBid.user_id : job.client_id,
      tradespersonId: isClient ? acceptedBid.tradesperson_id : null,
      rating: data.rating,
      comment,
      tags,
      quality: isClient ? data.quality ?? null : null,
      punctuality: isClient ? data.punctuality ?? null : null,
      value: isClient ? data.value ?? null : null,
      communication: isClient ? data.communication ?? null : null,
      tidiness: isClient ? data.tidiness ?? null : null,
      status: autoPublish ? 'PUBLISHED' : 'PENDING_MODERATION',
    })

    if (!created) return { error: 'You have already rated this job.' }

    await notify({
      userId: isClient ? acceptedBid.user_id : job.client_id,
      title: 'You have a new rating',
      body: `${data.rating} stars on ${job.title}.`,
      link: isClient ? '/tradie/reviews' : '/dashboard',
      kind: 'review',
    })
  } catch (error) {
    console.error('[reviews] submit failed', error)
    return { error: 'Could not save your rating. Please try again.' }
  }

  revalidatePath(`/dashboard/jobs/${data.jobId}`)
  revalidatePath('/tradie/reviews')
  redirect(isClient ? '/dashboard?rated=1' : '/tradie?rated=1')
}

export async function replyToReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') {
    return { error: 'Only the tradie who was reviewed can reply.' }
  }

  const reviewId = String(formData.get('reviewId'))
  const response = String(formData.get('response') ?? '').trim()
  if (response.length < 10) return { error: 'Write a slightly longer reply.' }
  if (response.length > 1500) return { error: 'That reply is too long.' }

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Tradie profile not found.' }

  const ok = await respondToReview(reviewId, tradie.id, response)
  if (!ok) return { error: 'That review is not yours to reply to.' }

  revalidatePath('/tradie/reviews')
  revalidatePath(`/find-a-tradie/${tradie.slug}`)
  return { success: 'Reply posted.' }
}
