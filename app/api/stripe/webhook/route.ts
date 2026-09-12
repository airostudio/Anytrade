import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { isStripeLive, verifyWebhook } from '@/lib/stripe'
import { fulfilPayment } from '@/lib/fulfilment'
import { markPaymentStatus } from '@/lib/repos/payments'
import { query } from '@/lib/db'

export const runtime = 'nodejs'
// Never cache: Stripe posts a fresh signed payload every time.
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  if (!isStripeLive()) {
    return NextResponse.json({ error: 'Stripe is not configured on this deployment.' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    // The raw body is required — parsing it first would break signature checks.
    const payload = await request.text()
    event = verifyWebhook(payload, signature)
  } catch (error) {
    console.error('[stripe] signature verification failed', error)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const meta = (session.metadata ?? {}) as Record<string, string>
        if (!meta.paymentId) break

        await query(
          `UPDATE payments
              SET stripe_checkout_session_id = $2,
                  stripe_payment_intent_id = COALESCE($3, stripe_payment_intent_id)
            WHERE id = $1`,
          [
            meta.paymentId,
            session.id,
            typeof session.payment_intent === 'string' ? session.payment_intent : null,
          ]
        )

        await fulfilPayment(meta.paymentId, {
          ...meta,
          subscriptionId:
            typeof session.subscription === 'string' ? session.subscription : meta.subscriptionId ?? '',
        })
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const meta = (session.metadata ?? {}) as Record<string, string>
        if (meta.paymentId) await markPaymentStatus(meta.paymentId, 'CANCELLED')
        break
      }

      case 'payment_intent.payment_failed': {
        const intent = event.data.object as Stripe.PaymentIntent
        const meta = (intent.metadata ?? {}) as Record<string, string>
        if (meta.paymentId) {
          await markPaymentStatus(meta.paymentId, 'FAILED', {
            failureMessage: intent.last_payment_error?.message ?? 'Payment failed.',
          })
        }
        break
      }

      case 'invoice.paid': {
        // Monthly membership renewal: extend the period and top the allowance up.
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId =
          typeof (invoice as { subscription?: unknown }).subscription === 'string'
            ? ((invoice as { subscription?: string }).subscription as string)
            : null
        if (subscriptionId) {
          await query(
            `UPDATE tradespeople
                SET membership_ends_at = now() + interval '1 month'
              WHERE stripe_subscription_id = $1`,
            [subscriptionId]
          )
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await query(
          `UPDATE tradespeople
              SET membership_tier = 'FREE',
                  membership_ends_at = now(),
                  is_featured = FALSE,
                  stripe_subscription_id = NULL
            WHERE stripe_subscription_id = $1`,
          [subscription.id]
        )
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null
        if (intentId) {
          await query(
            `UPDATE payments SET status = 'REFUNDED', refunded_at = now()
              WHERE stripe_payment_intent_id = $1`,
            [intentId]
          )
        }
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error(`[stripe] handler for ${event.type} failed`, error)
    // 500 tells Stripe to retry, which is what we want for a transient DB error.
    return NextResponse.json({ error: 'Handler failed.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/** Lets you confirm the endpoint is reachable from the Stripe dashboard. */
export async function GET() {
  return NextResponse.json({
    endpoint: 'stripe-webhook',
    configured: isStripeLive(),
    expects: ['checkout.session.completed', 'invoice.paid', 'customer.subscription.deleted'],
  })
}
