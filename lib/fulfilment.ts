import { adjustCredits, updateTradie, getTradieById } from './repos/tradies'
import { markPaymentStatus, getPayment } from './repos/payments'
import { notify } from './repos/notifications'
import { query } from './db'
import { CREDIT_PACKS, MEMBERSHIP_PLANS } from './constants'
import type { MembershipTier } from './types'

/**
 * What happens once money is confirmed.
 *
 * Called from the Stripe webhook in production and directly by the demo
 * checkout path when no Stripe keys are configured, so both routes end in
 * exactly the same database state.
 */
export async function fulfilPayment(paymentId: string, meta: Record<string, string>): Promise<void> {
  const payment = await getPayment(paymentId)
  if (!payment) {
    console.error('[fulfil] unknown payment', paymentId)
    return
  }
  // Already settled — Stripe retries webhooks, so this must be idempotent.
  if (['RELEASED', 'HELD_IN_ESCROW'].includes(payment.status)) return

  switch (payment.type) {
    case 'LEAD_CREDITS': {
      const pack = CREDIT_PACKS.find((p) => p.id === meta.packId)
      const credits = Number(meta.credits ?? pack?.credits ?? 0)
      if (meta.tradespersonId && credits > 0) {
        await adjustCredits(
          meta.tradespersonId,
          credits,
          'PURCHASE',
          `${pack?.name ?? 'Lead credits'} — ${credits} credits`,
          undefined,
          payment.id
        )
        await notify({
          userId: payment.user_id,
          title: `${credits} lead credits added`,
          body: 'You can quote on jobs straight away.',
          link: '/tradie/billing',
          kind: 'billing',
        })
      }
      await markPaymentStatus(paymentId, 'RELEASED')
      break
    }

    case 'MEMBERSHIP': {
      const tier = (meta.tier ?? 'SUBBIE') as MembershipTier
      const plan = MEMBERSHIP_PLANS.find((p) => p.tier === tier)
      if (meta.tradespersonId) {
        await query(
          `UPDATE tradespeople
              SET membership_tier = $2::membership_tier,
                  membership_started_at = now(),
                  membership_ends_at = now() + interval '1 month',
                  stripe_subscription_id = COALESCE($3, stripe_subscription_id)
            WHERE id = $1`,
          [meta.tradespersonId, tier, meta.subscriptionId ?? null]
        )

        if (plan?.includedCredits) {
          await adjustCredits(
            meta.tradespersonId,
            plan.includedCredits,
            'MEMBERSHIP_ALLOWANCE',
            `${plan.name} monthly allowance`,
            undefined,
            payment.id
          )
        }

        // Mid and top tiers buy placement in the directory.
        if (tier === 'GUVNOR' || tier === 'MASTER') {
          await updateTradie(meta.tradespersonId, {})
          await query(
            `UPDATE tradespeople SET is_featured = TRUE, featured_until = now() + interval '1 month' WHERE id = $1`,
            [meta.tradespersonId]
          )
        }

        await notify({
          userId: payment.user_id,
          title: `${plan?.name ?? tier} membership active`,
          body: plan?.includedCredits
            ? `${plan.includedCredits} lead credits have been added to your account.`
            : undefined,
          link: '/tradie/billing',
          kind: 'billing',
        })
      }
      await markPaymentStatus(paymentId, 'RELEASED')
      break
    }

    case 'JOB_DEPOSIT':
    case 'JOB_BALANCE': {
      // Funds sit in escrow until the customer signs the job off.
      await markPaymentStatus(paymentId, 'HELD_IN_ESCROW')
      if (payment.job_id) {
        await query(
          `UPDATE jobs SET status = 'IN_PROGRESS' WHERE id = $1 AND status = 'AWARDED'`,
          [payment.job_id]
        )
      }
      if (meta.tradieUserId) {
        await notify({
          userId: meta.tradieUserId,
          title: 'Job funded',
          body: 'The customer has paid into escrow. You are clear to start.',
          link: '/tradie/jobs',
          kind: 'billing',
        })
      }
      await notify({
        userId: payment.user_id,
        title: 'Payment held in escrow',
        body: 'We release it to your tradie when you sign the job off.',
        link: payment.job_id ? `/dashboard/jobs/${payment.job_id}` : '/dashboard',
        kind: 'billing',
      })
      break
    }

    case 'FEATURED_LISTING': {
      if (meta.tradespersonId) {
        await query(
          `UPDATE tradespeople SET is_featured = TRUE, featured_until = now() + interval '1 month' WHERE id = $1`,
          [meta.tradespersonId]
        )
      }
      await markPaymentStatus(paymentId, 'RELEASED')
      break
    }
  }
}

/** Escrow release: the client is happy, the tradie gets paid. */
export async function releaseEscrow(paymentId: string): Promise<void> {
  const payment = await getPayment(paymentId)
  if (!payment || payment.status !== 'HELD_IN_ESCROW') return

  await markPaymentStatus(paymentId, 'RELEASED')

  if (payment.job_id) {
    const rows = await query<{ user_id: string; tradesperson_id: string }>(
      `SELECT user_id, tradesperson_id FROM bids WHERE job_id = $1 AND status = 'ACCEPTED'`,
      [payment.job_id]
    )
    const winner = rows[0]
    if (winner) {
      const tradie = await getTradieById(winner.tradesperson_id)
      await notify({
        userId: winner.user_id,
        title: 'Payment released',
        body: `${payment.tradesperson_amount ? `$${payment.tradesperson_amount.toFixed(2)}` : 'Your payment'} is on its way${tradie?.stripe_onboarded ? '' : ' — connect your payout account to receive it'}.`,
        link: '/tradie/billing',
        kind: 'billing',
      })
    }
  }
}
