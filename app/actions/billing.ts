'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createCheckoutSession, findOrCreateCustomer, isStripeLive } from '@/lib/stripe'
import { createPayment, getPayment } from '@/lib/repos/payments'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { getUser, setStripeCustomerId } from '@/lib/repos/users'
import { getJob } from '@/lib/repos/jobs'
import { getBid } from '@/lib/repos/bids'
import { fulfilPayment, releaseEscrow } from '@/lib/fulfilment'
import { transferGroupFor } from '@/lib/connect'
import { recordAudit } from '@/lib/repos/admin'
import { CREDIT_PACKS, MEMBERSHIP_PLANS, PLATFORM_FEE_RATE } from '@/lib/constants'
import type { ActionState } from './auth'

/**
 * Every purchase follows the same shape: record a PENDING payment, then either
 * hand off to Stripe Checkout or, with no keys configured, settle it locally so
 * the flow can still be demonstrated end to end.
 */

export async function buyCredits(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') {
    return { error: 'Sign in as a tradie to buy lead credits.' }
  }

  const packId = String(formData.get('packId'))
  const pack = CREDIT_PACKS.find((p) => p.id === packId)
  if (!pack) return { error: 'Unknown credit pack.' }

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Tradie profile not found.' }

  const payment = await createPayment({
    userId: session.user.id,
    type: 'LEAD_CREDITS',
    description: `${pack.name} — ${pack.credits} lead credits`,
    amount: pack.priceAud,
  })

  const meta = {
    paymentId: payment.id,
    kind: 'LEAD_CREDITS',
    packId: pack.id,
    credits: String(pack.credits),
    tradespersonId: tradie.id,
  }

  if (!isStripeLive()) {
    await fulfilPayment(payment.id, meta)
    await recordAudit({
      actorId: session.user.id,
      action: 'billing.credits.demo',
      entityType: 'payment',
      entityId: payment.id,
      detail: `${pack.credits} credits (demo mode)`,
    })
    revalidatePath('/tradie/billing')
    redirect('/tradie/billing?demo=credits')
  }

  const url = await startCheckout({
    userId: session.user.id,
    name: pack.name,
    description: pack.blurb,
    amountAud: pack.priceAud,
    successPath: '/tradie/billing?paid=credits',
    cancelPath: '/tradie/billing?cancelled=1',
    metadata: meta,
  })
  redirect(url)
}

export async function startMembership(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') {
    return { error: 'Sign in as a tradie to change your membership.' }
  }

  const tier = String(formData.get('tier'))
  const plan = MEMBERSHIP_PLANS.find((p) => p.tier === tier)
  if (!plan) return { error: 'Unknown plan.' }

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Tradie profile not found.' }

  if (plan.tier === 'FREE') {
    return { error: 'To drop back to Casual, cancel your membership from the billing page.' }
  }

  const payment = await createPayment({
    userId: session.user.id,
    type: 'MEMBERSHIP',
    description: `${plan.name} membership — monthly`,
    amount: plan.monthlyAud,
  })

  const meta = {
    paymentId: payment.id,
    kind: 'MEMBERSHIP',
    tier: plan.tier,
    tradespersonId: tradie.id,
  }

  if (!isStripeLive()) {
    await fulfilPayment(payment.id, meta)
    await recordAudit({
      actorId: session.user.id,
      action: 'billing.membership.demo',
      entityType: 'payment',
      entityId: payment.id,
      detail: `${plan.name} (demo mode)`,
    })
    revalidatePath('/tradie/billing')
    redirect('/tradie/billing?demo=membership')
  }

  const url = await startCheckout({
    userId: session.user.id,
    name: `${plan.name} membership`,
    description: plan.blurb,
    amountAud: plan.monthlyAud,
    recurringInterval: 'month',
    successPath: '/tradie/billing?paid=membership',
    cancelPath: '/pricing?cancelled=1',
    metadata: meta,
  })
  redirect(url)
}

/** Client funds the accepted quote into escrow. */
export async function payJobDeposit(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'CLIENT') {
    return { error: 'Sign in as the customer to pay for this job.' }
  }

  const jobId = String(formData.get('jobId'))
  const job = await getJob(jobId)
  if (!job || job.client_id !== session.user.id) return { error: 'Job not found.' }
  if (!job.accepted_bid_id) return { error: 'Accept a quote before paying.' }

  const bid = await getBid(job.accepted_bid_id)
  if (!bid) return { error: 'Accepted quote not found.' }

  const amount = bid.amount
  const platformFee = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100

  const payment = await createPayment({
    jobId: job.id,
    userId: session.user.id,
    type: 'JOB_DEPOSIT',
    description: `${job.reference} — ${job.title}`,
    amount,
    platformFee,
    tradespersonAmount: Math.round((amount - platformFee) * 100) / 100,
  })

  const meta = {
    paymentId: payment.id,
    kind: 'JOB_DEPOSIT',
    jobId: job.id,
    tradieUserId: bid.user_id,
  }

  if (!isStripeLive()) {
    await fulfilPayment(payment.id, meta)
    revalidatePath(`/dashboard/jobs/${job.id}`)
    redirect(`/dashboard/jobs/${job.id}?demo=paid`)
  }

  const url = await startCheckout({
    userId: session.user.id,
    name: `${job.title} (${job.reference})`,
    description: `Held in escrow until you sign the job off. Includes the ${(PLATFORM_FEE_RATE * 100).toFixed(1)}% AnyTrade fee.`,
    amountAud: amount,
    successPath: `/dashboard/jobs/${job.id}?paid=1`,
    cancelPath: `/dashboard/jobs/${job.id}?cancelled=1`,
    metadata: meta,
    // Separate charges and transfers: this links the charge to the payout that
    // follows when the customer signs the job off.
    transferGroup: transferGroupFor(job.id),
  })
  redirect(url)
}

export async function releaseJobPayment(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user) return

  const paymentId = String(formData.get('paymentId'))
  const payment = await getPayment(paymentId)
  if (!payment) return
  if (payment.user_id !== session.user.id && session.user.role !== 'ADMIN') return

  await releaseEscrow(paymentId)
  await recordAudit({
    actorId: session.user.id,
    action: 'billing.escrow.released',
    entityType: 'payment',
    entityId: paymentId,
  })

  if (payment.job_id) revalidatePath(`/dashboard/jobs/${payment.job_id}`)
  revalidatePath('/admin/payments')
}

async function startCheckout(input: {
  userId: string
  name: string
  description?: string
  amountAud: number
  recurringInterval?: 'month' | 'year'
  successPath: string
  cancelPath: string
  metadata: Record<string, string>
  transferGroup?: string
}): Promise<string> {
  const user = await getUser(input.userId)
  if (!user) throw new Error('User not found.')

  const customerId = await findOrCreateCustomer(user.email, user.name, user.stripe_customer_id)
  if (customerId !== user.stripe_customer_id) {
    await setStripeCustomerId(user.id, customerId)
  }

  return createCheckoutSession({
    stripeCustomerId: customerId,
    successPath: input.successPath,
    cancelPath: input.cancelPath,
    metadata: input.metadata,
    transferGroup: input.transferGroup,
    line: {
      name: input.name,
      description: input.description,
      amountAud: input.amountAud,
      recurringInterval: input.recurringInterval,
    },
  })
}
