'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { query } from '@/lib/db'
import { recordAudit, setEnquiryHandled } from '@/lib/repos/admin'
import { adjustCredits, refreshTradieRatings, updateTradie } from '@/lib/repos/tradies'
import { moderateReview } from '@/lib/repos/reviews'
import { setSuspended } from '@/lib/repos/users'
import { setMemberStatus, setPostHidden, setPostPinned } from '@/lib/repos/homegirls'
import { updateJobStatus } from '@/lib/repos/jobs'
import { markPaymentStatus } from '@/lib/repos/payments'
import { releaseEscrow } from '@/lib/fulfilment'
import { setSetting } from '@/lib/repos/settings'
import { notify } from '@/lib/repos/notifications'
import type { ActionState } from './auth'
import type {
  HomegirlsStatus,
  JobStatus,
  MembershipTier,
  PaymentStatus,
  ReviewStatus,
  VerificationStatus,
} from '@/lib/types'

/** Every admin action funnels through this guard. */
async function requireAdmin() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Admin access required.')
  }
  return session.user
}

// ── Users ───────────────────────────────────────────────────────────────────

export async function adminSetSuspended(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const userId = String(formData.get('userId'))
  const suspend = formData.get('suspend') === 'true'
  const reason = String(formData.get('reason') ?? '') || undefined

  await setSuspended(userId, suspend, reason)
  await recordAudit({
    actorId: admin.id,
    action: suspend ? 'admin.user.suspended' : 'admin.user.reinstated',
    entityType: 'user',
    entityId: userId,
    detail: reason,
  })
  revalidatePath('/admin/users')
}

// ── Tradie verification ─────────────────────────────────────────────────────

export async function adminSetVerification(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const tradespersonId = String(formData.get('tradespersonId'))
  const status = String(formData.get('status')) as VerificationStatus
  const notes = String(formData.get('notes') ?? '') || null

  await query(
    `UPDATE tradespeople
        SET verification_status = $2::verification_status,
            verified_at = CASE WHEN $2 = 'VERIFIED' THEN now() ELSE NULL END,
            verification_notes = $3
      WHERE id = $1`,
    [tradespersonId, status, notes]
  )

  const rows = await query<{ user_id: string; business_name: string }>(
    'SELECT user_id, business_name FROM tradespeople WHERE id = $1',
    [tradespersonId]
  )
  if (rows[0]) {
    await notify({
      userId: rows[0].user_id,
      title: status === 'VERIFIED' ? 'Your licence has been verified' : `Verification ${status.toLowerCase()}`,
      body: notes ?? undefined,
      link: '/tradie/profile',
      kind: 'verification',
    })
  }

  await recordAudit({
    actorId: admin.id,
    action: 'admin.tradie.verification',
    entityType: 'tradesperson',
    entityId: tradespersonId,
    detail: `${status}${notes ? ` — ${notes}` : ''}`,
  })
  revalidatePath('/admin/tradies')
}

export async function adminSetMembership(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const tradespersonId = String(formData.get('tradespersonId'))
  const tier = String(formData.get('tier')) as MembershipTier

  await query(
    `UPDATE tradespeople
        SET membership_tier = $2::membership_tier,
            membership_started_at = CASE WHEN $2 = 'FREE' THEN NULL ELSE now() END,
            membership_ends_at = CASE WHEN $2 = 'FREE' THEN NULL ELSE now() + interval '1 month' END
      WHERE id = $1`,
    [tradespersonId, tier]
  )
  await recordAudit({
    actorId: admin.id,
    action: 'admin.tradie.membership',
    entityType: 'tradesperson',
    entityId: tradespersonId,
    detail: tier,
  })
  revalidatePath('/admin/tradies')
}

export async function adminAdjustCredits(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const tradespersonId = String(formData.get('tradespersonId'))
  const delta = Number(formData.get('delta') ?? 0)
  if (!delta) return

  await adjustCredits(tradespersonId, delta, 'ADMIN_ADJUSTMENT', `Adjusted by ${admin.name ?? 'admin'}`)
  await recordAudit({
    actorId: admin.id,
    action: 'admin.credits.adjusted',
    entityType: 'tradesperson',
    entityId: tradespersonId,
    detail: `${delta > 0 ? '+' : ''}${delta} credits`,
  })
  revalidatePath('/admin/tradies')
}

export async function adminToggleFeatured(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const tradespersonId = String(formData.get('tradespersonId'))
  const featured = formData.get('featured') === 'true'

  await query(
    `UPDATE tradespeople
        SET is_featured = $2,
            featured_until = CASE WHEN $2 THEN now() + interval '1 month' ELSE NULL END
      WHERE id = $1`,
    [tradespersonId, featured]
  )
  await recordAudit({
    actorId: admin.id,
    action: 'admin.tradie.featured',
    entityType: 'tradesperson',
    entityId: tradespersonId,
    detail: String(featured),
  })
  revalidatePath('/admin/tradies')
}

// ── Jobs ────────────────────────────────────────────────────────────────────

export async function adminSetJobStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const jobId = String(formData.get('jobId'))
  const status = String(formData.get('status')) as JobStatus

  await updateJobStatus(jobId, status, { cancelReason: 'Changed by admin' })
  await recordAudit({
    actorId: admin.id,
    action: 'admin.job.status',
    entityType: 'job',
    entityId: jobId,
    detail: status,
  })
  revalidatePath('/admin/jobs')
}

// ── Reviews ─────────────────────────────────────────────────────────────────

export async function adminModerateReview(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const reviewId = String(formData.get('reviewId'))
  const status = String(formData.get('status')) as ReviewStatus
  const note = String(formData.get('note') ?? '') || undefined

  await moderateReview(reviewId, status, note)
  await recordAudit({
    actorId: admin.id,
    action: 'admin.review.moderated',
    entityType: 'review',
    entityId: reviewId,
    detail: `${status}${note ? ` — ${note}` : ''}`,
  })
  revalidatePath('/admin/reviews')
}

export async function adminRecalcRatings(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const tradespersonId = String(formData.get('tradespersonId'))
  await refreshTradieRatings(tradespersonId)
  await recordAudit({
    actorId: admin.id,
    action: 'admin.ratings.recalculated',
    entityType: 'tradesperson',
    entityId: tradespersonId,
  })
  revalidatePath('/admin/reviews')
}

// ── Payments ────────────────────────────────────────────────────────────────

export async function adminUpdatePayment(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const paymentId = String(formData.get('paymentId'))
  const status = String(formData.get('status')) as PaymentStatus

  if (status === 'RELEASED') {
    await releaseEscrow(paymentId)
  } else {
    await markPaymentStatus(paymentId, status)
  }

  await recordAudit({
    actorId: admin.id,
    action: 'admin.payment.status',
    entityType: 'payment',
    entityId: paymentId,
    detail: status,
  })
  revalidatePath('/admin/payments')
}

// ── Homegirls ───────────────────────────────────────────────────────────────

export async function adminSetHomegirlStatus(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const memberId = String(formData.get('memberId'))
  const status = String(formData.get('status')) as HomegirlsStatus

  await setMemberStatus(memberId, status, admin.id)
  await recordAudit({
    actorId: admin.id,
    action: 'admin.homegirls.status',
    entityType: 'homegirls_member',
    entityId: memberId,
    detail: status,
  })
  revalidatePath('/admin/homegirls')
  revalidatePath('/homegirls')
}

export async function adminModeratePost(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const postId = String(formData.get('postId'))

  if (formData.get('hidden') !== null) {
    await setPostHidden(postId, formData.get('hidden') === 'true')
  }
  if (formData.get('pinned') !== null) {
    await setPostPinned(postId, formData.get('pinned') === 'true')
  }

  await recordAudit({
    actorId: admin.id,
    action: 'admin.homegirls.post',
    entityType: 'homegirls_post',
    entityId: postId,
  })
  revalidatePath('/admin/homegirls')
  revalidatePath('/homegirls')
}

// ── Enquiries ───────────────────────────────────────────────────────────────

export async function adminHandleEnquiry(formData: FormData): Promise<void> {
  const admin = await requireAdmin()
  const id = String(formData.get('id'))
  const handled = formData.get('handled') === 'true'

  await setEnquiryHandled(id, handled)
  await recordAudit({
    actorId: admin.id,
    action: 'admin.enquiry.handled',
    entityType: 'contact_enquiry',
    entityId: id,
    detail: String(handled),
  })
  revalidatePath('/admin/enquiries')
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function adminSaveSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin()

  const entries = Array.from(formData.entries()).filter(([key]) => key.startsWith('setting:'))
  if (!entries.length) return { error: 'Nothing to save.' }

  // Passcodes guard the back office and the members' network, so refuse weak
  // ones outright. The values below were published in earlier versions of the
  // source, so they are treated as compromised and never accepted.
  const PUBLISHED = new Set(['toolbox-1972', 'homegirls-2024', 'Admin!2345'])
  for (const [key, raw] of entries) {
    if (!key.startsWith('setting:gate.')) continue
    const value = String(raw).trim()
    if (!value) continue // empty means "closed", which is allowed
    if (value.length < 12) {
      return { error: 'Passcodes must be at least 12 characters.' }
    }
    if (PUBLISHED.has(value)) {
      return { error: 'That passcode has been published in the source code. Choose a new one.' }
    }
  }

  try {
    for (const [key, value] of entries) {
      await setSetting(key.replace(/^setting:/, ''), String(value))
    }
  } catch (error) {
    console.error('[admin] settings save failed', error)
    return { error: 'Could not save settings.' }
  }

  await recordAudit({
    actorId: admin.id,
    action: 'admin.settings.saved',
    entityType: 'site_settings',
    detail: entries.map(([key]) => key.replace(/^setting:/, '')).join(', '),
  })

  revalidatePath('/admin/settings')
  return { success: `Saved ${entries.length} setting${entries.length === 1 ? '' : 's'}.` }
}
