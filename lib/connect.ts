import {
  createConnectAccount,
  createExpressDashboardLink,
  createOnboardingLink,
  createTransfer,
  chargeIdForIntent,
  fetchConnectAccount,
  isStripeLive,
} from './stripe'
import {
  getTradieById,
  getTradieByStripeAccount,
  saveConnectStatus,
  setStripeAccountId,
} from './repos/tradies'
import {
  getPayment,
  paymentsAwaitingTransfer,
  recordTransfer,
  setTransferGroup,
} from './repos/payments'
import { notify } from './repos/notifications'
import { query } from './db'
import type { PaymentRow, TradieProfile } from './types'

/**
 * Stripe Connect orchestration.
 *
 * Tradies onboard as Express accounts. Job money uses separate charges and
 * transfers: the customer's card is charged to the platform, the funds are held
 * in escrow, and a Transfer moves the tradie's share when the job is signed off.
 *
 * Without Stripe keys everything below runs in demo mode — accounts are
 * simulated and transfers are recorded as paid — so the flow is demonstrable
 * end to end and nothing needs rewriting when keys are added.
 */

export type PayoutState =
  | 'not_started'
  | 'incomplete' // account exists, Stripe still wants details
  | 'pending_review' // details submitted, Stripe verifying
  | 'ready'
  | 'restricted' // was enabled, now blocked

export interface PayoutSummary {
  state: PayoutState
  accountId: string | null
  payoutsEnabled: boolean
  chargesEnabled: boolean
  detailsSubmitted: boolean
  requirements: string[]
  label: string
  blurb: string
}

/** Turn the stored Connect columns into something the UI can render directly. */
export function payoutSummary(tradie: TradieProfile): PayoutSummary {
  const base = {
    accountId: tradie.stripe_account_id,
    payoutsEnabled: tradie.stripe_payouts_enabled,
    chargesEnabled: tradie.stripe_charges_enabled,
    detailsSubmitted: tradie.stripe_details_submitted,
    requirements: tradie.stripe_requirements ?? [],
  }

  if (!tradie.stripe_account_id) {
    return {
      ...base,
      state: 'not_started',
      label: 'Not set up',
      blurb:
        'Connect a payout account so escrowed job payments can reach your bank. Takes about five minutes.',
    }
  }
  if (tradie.stripe_payouts_enabled) {
    return {
      ...base,
      state: 'ready',
      label: 'Ready for payouts',
      blurb: 'Escrowed job payments are transferred to your bank when a customer signs the job off.',
    }
  }
  if (base.requirements.length) {
    return {
      ...base,
      state: tradie.stripe_details_submitted ? 'restricted' : 'incomplete',
      label: tradie.stripe_details_submitted ? 'Action needed' : 'Half finished',
      blurb: 'Stripe still needs a few details before it can pay you. Pick up where you left off.',
    }
  }
  return {
    ...base,
    state: 'pending_review',
    label: 'Being checked',
    blurb: 'Stripe is verifying your details. This usually takes a few minutes, sometimes a day.',
  }
}

/** Human-readable versions of Stripe's requirement keys. */
export function describeRequirement(key: string): string {
  const cleaned = key.replace(/^individual\./, '').replace(/^company\./, '')
  const map: Record<string, string> = {
    'external_account': 'Bank account for payouts',
    'dob.day': 'Date of birth',
    'dob.month': 'Date of birth',
    'dob.year': 'Date of birth',
    'address.line1': 'Residential address',
    'address.city': 'Residential address',
    'address.postal_code': 'Residential address',
    'address.state': 'Residential address',
    'id_number': 'Identity document',
    'verification.document': 'Photo ID',
    'first_name': 'First name',
    'last_name': 'Last name',
    'email': 'Email address',
    'phone': 'Phone number',
    'business_profile.url': 'Business website',
    'business_profile.mcc': 'Business category',
    'tos_acceptance.date': 'Accept the Stripe terms',
    'tos_acceptance.ip': 'Accept the Stripe terms',
  }
  return map[cleaned] ?? cleaned.replace(/[._]/g, ' ')
}

/**
 * Start (or resume) onboarding. Returns the URL to send the tradie to.
 * In demo mode there is nothing to send them to, so the account is marked
 * ready and null is returned.
 */
export async function beginOnboarding(
  tradie: TradieProfile
): Promise<{ url: string | null; demo: boolean }> {
  if (!isStripeLive()) {
    const fakeId = tradie.stripe_account_id ?? `acct_demo_${tradie.id.slice(0, 12)}`
    await setStripeAccountId(tradie.id, fakeId)
    await saveConnectStatus(tradie.id, {
      chargesEnabled: true,
      payoutsEnabled: true,
      detailsSubmitted: true,
      requirements: [],
    })
    await settlePendingTransfers(tradie.id)
    return { url: null, demo: true }
  }

  let accountId = tradie.stripe_account_id
  if (!accountId) {
    const created = await createConnectAccount({
      email: tradie.email,
      businessName: tradie.business_name,
      tradespersonId: tradie.id,
      suburb: tradie.base_suburb,
      state: tradie.state,
      postcode: tradie.postcode,
    })
    accountId = created.id
    await setStripeAccountId(tradie.id, accountId)
    await saveConnectStatus(tradie.id, {
      chargesEnabled: created.chargesEnabled,
      payoutsEnabled: created.payoutsEnabled,
      detailsSubmitted: created.detailsSubmitted,
      requirements: created.requirements,
    })
  }

  return { url: await createOnboardingLink(accountId), demo: false }
}

/** Pull the latest account state from Stripe and store it. */
export async function syncConnectAccount(tradespersonId: string): Promise<PayoutSummary | null> {
  const tradie = await getTradieById(tradespersonId)
  if (!tradie?.stripe_account_id) return null
  if (!isStripeLive()) return payoutSummary(tradie)

  try {
    const status = await fetchConnectAccount(tradie.stripe_account_id)
    await saveConnectStatus(tradespersonId, {
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      requirements: status.requirements,
    })
    if (status.payoutsEnabled) await settlePendingTransfers(tradespersonId)

    const refreshed = await getTradieById(tradespersonId)
    return refreshed ? payoutSummary(refreshed) : null
  } catch (error) {
    console.error('[connect] account sync failed', error)
    return payoutSummary(tradie)
  }
}

export async function dashboardLink(tradie: TradieProfile): Promise<string | null> {
  if (!tradie.stripe_account_id || !isStripeLive()) return null
  try {
    return await createExpressDashboardLink(tradie.stripe_account_id)
  } catch (error) {
    console.error('[connect] dashboard link failed', error)
    return null
  }
}

/** The transfer group tying an escrowed charge to its eventual payout. */
export function transferGroupFor(jobId: string): string {
  return `job_${jobId}`
}

/**
 * Pay a tradie their share of a released escrow payment.
 *
 * Called when the customer signs the job off, and again by the sweep below if
 * the tradie had not finished onboarding at that point. Safe to call twice: an
 * already-paid payment is skipped, and the Stripe call carries an idempotency
 * key derived from the payment id.
 */
export async function payoutForPayment(paymentId: string): Promise<void> {
  const payment = await getPayment(paymentId)
  if (!payment) return
  if (payment.transfer_status === 'paid') return
  if (payment.tradesperson_amount <= 0) return

  // Who won the job this payment belongs to?
  const rows = await query<{ tradesperson_id: string; user_id: string }>(
    `SELECT tradesperson_id, user_id FROM bids WHERE job_id = $1 AND status = 'ACCEPTED'`,
    [payment.job_id]
  )
  const winner = rows[0]
  if (!winner) return

  const tradie = await getTradieById(winner.tradesperson_id)
  if (!tradie) return

  const readyForPayout = tradie.stripe_payouts_enabled && Boolean(tradie.stripe_account_id)

  if (!readyForPayout) {
    await recordTransfer(paymentId, { status: 'pending_account' })
    await notify({
      userId: winner.user_id,
      title: 'Payment waiting on your payout account',
      body: `$${payment.tradesperson_amount.toFixed(2)} is ready to send. Connect your payout account and we will release it straight away.`,
      link: '/tradie/billing',
      kind: 'billing',
    })
    return
  }

  // Demo mode: record the payout without calling Stripe.
  if (!isStripeLive()) {
    await recordTransfer(paymentId, {
      status: 'paid',
      transferId: `tr_demo_${paymentId.slice(0, 16)}`,
      destinationAccountId: tradie.stripe_account_id,
    })
    await notify({
      userId: winner.user_id,
      title: 'Payment sent',
      body: `$${payment.tradesperson_amount.toFixed(2)} has been transferred to your payout account.`,
      link: '/tradie/billing',
      kind: 'billing',
    })
    return
  }

  try {
    // Sourcing the transfer from the original charge keeps the two sides
    // reconciled in Stripe and avoids drawing on unrelated platform balance.
    const sourceTransaction = payment.stripe_payment_intent_id
      ? await chargeIdForIntent(payment.stripe_payment_intent_id).catch(() => null)
      : null

    const transfer = await createTransfer({
      amountAud: payment.tradesperson_amount,
      destinationAccountId: tradie.stripe_account_id as string,
      transferGroup: payment.transfer_group ?? (payment.job_id ? transferGroupFor(payment.job_id) : null),
      sourceTransaction,
      metadata: {
        paymentId: payment.id,
        jobId: payment.job_id ?? '',
        tradespersonId: tradie.id,
      },
    })

    await recordTransfer(paymentId, {
      status: 'paid',
      transferId: transfer.id,
      destinationAccountId: tradie.stripe_account_id,
    })
    await notify({
      userId: winner.user_id,
      title: 'Payment sent',
      body: `$${payment.tradesperson_amount.toFixed(2)} is on its way to your bank.`,
      link: '/tradie/billing',
      kind: 'billing',
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Transfer failed.'
    console.error('[connect] transfer failed', message)
    await recordTransfer(paymentId, {
      status: 'failed',
      destinationAccountId: tradie.stripe_account_id,
      error: message,
    })
  }
}

/**
 * Pay out anything that was released while the tradie had no usable payout
 * account. Runs whenever their account becomes payout-enabled.
 */
export async function settlePendingTransfers(tradespersonId: string): Promise<number> {
  const pending: PaymentRow[] = await paymentsAwaitingTransfer(tradespersonId)
  let settled = 0
  for (const payment of pending) {
    await payoutForPayment(payment.id)
    settled++
  }
  return settled
}

/** Handle an `account.updated` webhook from a connected account. */
export async function handleAccountUpdated(account: {
  id: string
  charges_enabled?: boolean
  payouts_enabled?: boolean
  details_submitted?: boolean
  requirements?: {
    currently_due?: string[] | null
    past_due?: string[] | null
    eventually_due?: string[] | null
  } | null
}): Promise<void> {
  const tradie = await getTradieByStripeAccount(account.id)
  if (!tradie) return

  const requirements = Array.from(
    new Set([
      ...(account.requirements?.currently_due ?? []),
      ...(account.requirements?.past_due ?? []),
      ...(account.requirements?.eventually_due ?? []),
    ])
  )
  const payoutsEnabled = Boolean(account.payouts_enabled)
  const wasEnabled = tradie.stripe_payouts_enabled

  await saveConnectStatus(tradie.id, {
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled,
    detailsSubmitted: Boolean(account.details_submitted),
    requirements,
  })

  if (payoutsEnabled && !wasEnabled) {
    await notify({
      userId: tradie.user_id,
      title: 'Payout account approved',
      body: 'You can now be paid through AnyTrade. Any held payments are on their way.',
      link: '/tradie/billing',
      kind: 'billing',
    })
    await settlePendingTransfers(tradie.id)
  } else if (!payoutsEnabled && wasEnabled) {
    await notify({
      userId: tradie.user_id,
      title: 'Payout account needs attention',
      body: 'Stripe has paused payouts until some details are updated.',
      link: '/tradie/billing',
      kind: 'billing',
    })
  }
}

/** Record the transfer group on a job payment as soon as checkout completes. */
export async function attachTransferGroup(paymentId: string, jobId: string): Promise<void> {
  const rows = await query<{ stripe_account_id: string | null }>(
    `SELECT t.stripe_account_id
       FROM bids b JOIN tradespeople t ON t.id = b.tradesperson_id
      WHERE b.job_id = $1 AND b.status = 'ACCEPTED'`,
    [jobId]
  )
  await setTransferGroup(paymentId, transferGroupFor(jobId), rows[0]?.stripe_account_id ?? null)
}
