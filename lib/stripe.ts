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
    ...(isSubscription ? { subscription_data: { metadata: opts.metadata } } : {}),
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
