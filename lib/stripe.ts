import Stripe from 'stripe'

/**
 * Stripe wiring.
 *
 * The whole site stays usable without Stripe keys: `isStripeLive()` is false,
 * checkout falls back to a clearly-labelled demo flow that records the payment
 * locally, and nothing throws. Add STRIPE_SECRET_KEY and the same code paths
 * start creating real Checkout Sessions.
 */

let cached: Stripe | null = null

export function isStripeLive(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set — Stripe is running in demo mode.')
  }
  if (!cached) {
    cached = new Stripe(key, { typescript: true })
  }
  return cached
}

export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

/** Stripe works in the smallest currency unit. */
export function toCents(aud: number): number {
  return Math.round(aud * 100)
}

export function fromCents(cents: number): number {
  return cents / 100
}

export interface CheckoutLine {
  name: string
  description?: string
  amountAud: number
  quantity?: number
  /** Set for membership plans so Checkout creates a subscription. */
  recurringInterval?: 'month' | 'year'
}

export interface CheckoutOptions {
  customerEmail?: string
  stripeCustomerId?: string
  successPath: string
  cancelPath: string
  metadata: Record<string, string>
  line: CheckoutLine
  /**
   * Ties this charge to the Transfer that pays the tradie later. Required for
   * escrowed job payments, which use separate charges and transfers so the
   * money can be held until the customer signs the job off.
   */
  transferGroup?: string
}

/** Create a Checkout Session and return the URL to redirect the buyer to. */
export async function createCheckoutSession(opts: CheckoutOptions): Promise<string> {
  const client = stripe()
  const isSubscription = Boolean(opts.line.recurringInterval)

  const session = await client.checkout.sessions.create({
    mode: isSubscription ? 'subscription' : 'payment',
    ...(opts.stripeCustomerId
      ? { customer: opts.stripeCustomerId }
      : { customer_email: opts.customerEmail }),
    line_items: [
      {
        quantity: opts.line.quantity ?? 1,
        price_data: {
          currency: 'aud',
          unit_amount: toCents(opts.line.amountAud),
          product_data: {
            name: opts.line.name,
            ...(opts.line.description ? { description: opts.line.description } : {}),
          },
          ...(opts.line.recurringInterval
            ? { recurring: { interval: opts.line.recurringInterval } }
            : {}),
        },
      },
    ],
    metadata: opts.metadata,
    ...(isSubscription
      ? { subscription_data: { metadata: opts.metadata } }
      : {
          payment_intent_data: {
            metadata: opts.metadata,
            ...(opts.transferGroup ? { transfer_group: opts.transferGroup } : {}),
          },
        }),
    success_url: `${siteUrl()}${opts.successPath}${opts.successPath.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}${opts.cancelPath}`,
    allow_promotion_codes: true,
  })

  if (!session.url) throw new Error('Stripe did not return a checkout URL.')
  return session.url
}

export async function findOrCreateCustomer(
  email: string,
  name: string,
  existingId: string | null
): Promise<string> {
  const client = stripe()
  if (existingId) {
    try {
      const found = await client.customers.retrieve(existingId)
      if (!found.deleted) return found.id
    } catch {
      // Customer was removed in the Stripe dashboard — fall through and make a new one.
    }
  }
  const created = await client.customers.create({ email, name })
  return created.id
}

export function verifyWebhook(payload: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new Error('STRIPE_WEBHOOK_SECRET is not set.')
  return stripe().webhooks.constructEvent(payload, signature, secret)
}

// ─────────────────────────────────────────────────────────────────────────────
//  Stripe Connect
//
//  Tradies are onboarded as Express accounts. Job money uses *separate charges
//  and transfers*: the customer is charged to the platform, the funds sit in
//  escrow, and a Transfer moves the tradie's share across when the job is
//  signed off. Destination charges would pay out at capture, which is exactly
//  what escrow is meant to prevent.
// ─────────────────────────────────────────────────────────────────────────────

/** The country the platform operates in — drives Connect account defaults. */
export const PLATFORM_COUNTRY = process.env.STRIPE_CONNECT_COUNTRY ?? 'AU'

export interface ConnectAccountStatus {
  id: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  /** Outstanding requirements Stripe still needs before payouts can run. */
  requirements: string[]
  disabledReason: string | null
}

function toStatus(account: Stripe.Account): ConnectAccountStatus {
  const req = account.requirements
  const outstanding = [
    ...(req?.currently_due ?? []),
    ...(req?.past_due ?? []),
    ...(req?.eventually_due ?? []),
  ]
  return {
    id: account.id,
    chargesEnabled: Boolean(account.charges_enabled),
    payoutsEnabled: Boolean(account.payouts_enabled),
    detailsSubmitted: Boolean(account.details_submitted),
    requirements: Array.from(new Set(outstanding)),
    disabledReason: req?.disabled_reason ?? null,
  }
}

/** Create the Express account a tradie is paid into. */
export async function createConnectAccount(input: {
  email: string
  businessName: string
  tradespersonId: string
  suburb?: string | null
  state?: string | null
  postcode?: string | null
}): Promise<ConnectAccountStatus> {
  const account = await stripe().accounts.create({
    type: 'express',
    country: PLATFORM_COUNTRY,
    email: input.email,
    business_type: 'individual',
    business_profile: {
      name: input.businessName,
      product_description: 'Trade services booked through AnyTrade',
      mcc: '1520', // general contractors — residential building
    },
    capabilities: {
      transfers: { requested: true },
    },
    settings: {
      payouts: { schedule: { interval: 'daily', delay_days: 'minimum' } },
    },
    metadata: { tradespersonId: input.tradespersonId },
  })
  return toStatus(account)
}

/**
 * A one-time onboarding link. `refresh_url` is where Stripe sends the tradie
 * if the link expires before they finish, so it must start the flow again.
 */
export async function createOnboardingLink(accountId: string): Promise<string> {
  const link = await stripe().accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: `${siteUrl()}/tradie/billing/connect/refresh`,
    return_url: `${siteUrl()}/tradie/billing?connect=done`,
    collection_options: { fields: 'currently_due' },
  })
  return link.url
}

export async function fetchConnectAccount(accountId: string): Promise<ConnectAccountStatus> {
  return toStatus(await stripe().accounts.retrieve(accountId))
}

/** Single-use link into the tradie's Stripe Express dashboard. */
export async function createExpressDashboardLink(accountId: string): Promise<string> {
  const link = await stripe().accounts.createLoginLink(accountId)
  return link.url
}

/** Move a tradie's share of an escrowed job payment to their account. */
export async function createTransfer(input: {
  amountAud: number
  destinationAccountId: string
  transferGroup?: string | null
  /** Links the transfer to the original charge so Stripe reports it together. */
  sourceTransaction?: string | null
  metadata?: Record<string, string>
}): Promise<Stripe.Transfer> {
  return stripe().transfers.create(
    {
      amount: toCents(input.amountAud),
      currency: 'aud',
      destination: input.destinationAccountId,
      ...(input.transferGroup ? { transfer_group: input.transferGroup } : {}),
      ...(input.sourceTransaction ? { source_transaction: input.sourceTransaction } : {}),
      metadata: input.metadata ?? {},
    },
    // Stripe dedupes on this key, so a webhook retry cannot pay a tradie twice.
    input.metadata?.paymentId
      ? { idempotencyKey: `transfer_${input.metadata.paymentId}` }
      : undefined
  )
}

/** The charge behind a PaymentIntent, needed to source a transfer from it. */
export async function chargeIdForIntent(paymentIntentId: string): Promise<string | null> {
  const intent = await stripe().paymentIntents.retrieve(paymentIntentId)
  const latest = intent.latest_charge
  return typeof latest === 'string' ? latest : (latest?.id ?? null)
}

/** Platform balance — surfaced in admin so unpaid transfers make sense. */
export async function platformBalance(): Promise<{ available: number; pending: number }> {
  const balance = await stripe().balance.retrieve()
  const sum = (entries: Stripe.Balance.Available[]) =>
    entries.filter((e) => e.currency === 'aud').reduce((total, e) => total + e.amount, 0)
  return {
    available: fromCents(sum(balance.available)),
    pending: fromCents(sum(balance.pending)),
  }
}
