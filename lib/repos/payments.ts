import { query, queryOne, safeRead } from '../db'
import type { PaymentRow, PaymentStatus, PaymentType, PaymentWithContext } from '../types'

const PAYMENT_SELECT = `
  SELECT p.*,
         u.name  AS user_name,
         u.email AS user_email,
         j.title     AS job_title,
         j.reference AS job_reference
    FROM payments p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN jobs j ON j.id = p.job_id
`

export interface NewPayment {
  jobId?: string | null
  userId: string
  type: PaymentType
  description?: string
  amount: number
  platformFee?: number
  tradespersonAmount?: number
  stripeCheckoutSessionId?: string | null
  status?: PaymentStatus
}

export async function createPayment(input: NewPayment): Promise<PaymentRow> {
  const row = await queryOne<PaymentRow>(
    `INSERT INTO payments (job_id, user_id, type, description, amount, platform_fee,
                           tradesperson_amount, stripe_checkout_session_id, status)
     VALUES ($1,$2,$3::payment_type,$4,$5,$6,$7,$8,$9::payment_status)
     RETURNING *`,
    [
      input.jobId ?? null,
      input.userId,
      input.type,
      input.description ?? null,
      input.amount,
      input.platformFee ?? 0,
      input.tradespersonAmount ?? 0,
      input.stripeCheckoutSessionId ?? null,
      input.status ?? 'PENDING',
    ]
  )
  if (!row) throw new Error('Could not record that payment.')
  return row
}

export async function getPayment(id: string): Promise<PaymentWithContext | null> {
  return safeRead(() => queryOne<PaymentWithContext>(`${PAYMENT_SELECT} WHERE p.id = $1`, [id]), null)
}

export async function getPaymentBySession(sessionId: string): Promise<PaymentRow | null> {
  return safeRead(
    () => queryOne<PaymentRow>('SELECT * FROM payments WHERE stripe_checkout_session_id = $1', [sessionId]),
    null
  )
}

export async function markPaymentStatus(
  id: string,
  status: PaymentStatus,
  extra: {
    paymentIntentId?: string | null
    invoiceId?: string | null
    receiptUrl?: string | null
    failureMessage?: string | null
  } = {}
): Promise<PaymentRow | null> {
  return queryOne<PaymentRow>(
    `UPDATE payments
        SET status = $2::payment_status,
            stripe_payment_intent_id = COALESCE($3, stripe_payment_intent_id),
            stripe_invoice_id        = COALESCE($4, stripe_invoice_id),
            receipt_url              = COALESCE($5, receipt_url),
            failure_message          = COALESCE($6, failure_message),
            held_at     = CASE WHEN $2 = 'HELD_IN_ESCROW' THEN now() ELSE held_at END,
            released_at = CASE WHEN $2 = 'RELEASED'       THEN now() ELSE released_at END,
            refunded_at = CASE WHEN $2 = 'REFUNDED'       THEN now() ELSE refunded_at END
      WHERE id = $1
      RETURNING *`,
    [
      id,
      status,
      extra.paymentIntentId ?? null,
      extra.invoiceId ?? null,
      extra.receiptUrl ?? null,
      extra.failureMessage ?? null,
    ]
  )
}

export async function paymentsForUser(userId: string, limit = 50): Promise<PaymentWithContext[]> {
  return safeRead(
    () =>
      query<PaymentWithContext>(
        `${PAYMENT_SELECT} WHERE p.user_id = $1 ORDER BY p.created_at DESC LIMIT $2`,
        [userId, limit]
      ),
    []
  )
}

export async function paymentsForJob(jobId: string): Promise<PaymentWithContext[]> {
  return safeRead(
    () => query<PaymentWithContext>(`${PAYMENT_SELECT} WHERE p.job_id = $1 ORDER BY p.created_at DESC`, [jobId]),
    []
  )
}

export async function listAllPayments(
  opts: { status?: PaymentStatus; type?: PaymentType; limit?: number } = {}
): Promise<PaymentWithContext[]> {
  const clauses: string[] = []
  const params: unknown[] = []
  const add = (v: unknown) => `$${params.push(v)}`

  if (opts.status) clauses.push(`p.status = ${add(opts.status)}::payment_status`)
  if (opts.type) clauses.push(`p.type = ${add(opts.type)}::payment_type`)

  return safeRead(
    () =>
      query<PaymentWithContext>(
        `${PAYMENT_SELECT} ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
          ORDER BY p.created_at DESC LIMIT ${add(opts.limit ?? 200)}`,
        params
      ),
    []
  )
}

export interface RevenueSummary {
  grossAllTime: number
  feesAllTime: number
  heldInEscrow: number
  releasedAllTime: number
  last30Gross: number
  last30Fees: number
  subscriptionMrr: number
  creditRevenue: number
}

export async function revenueSummary(): Promise<RevenueSummary> {
  const row = await safeRead(
    () =>
      queryOne<Record<string, number>>(
        `SELECT
           COALESCE(SUM(amount)      FILTER (WHERE status IN ('RELEASED','HELD_IN_ESCROW','PROCESSING')), 0) AS gross_all_time,
           COALESCE(SUM(platform_fee) FILTER (WHERE status IN ('RELEASED','HELD_IN_ESCROW')), 0)            AS fees_all_time,
           COALESCE(SUM(amount)      FILTER (WHERE status = 'HELD_IN_ESCROW'), 0)                            AS held_in_escrow,
           COALESCE(SUM(amount)      FILTER (WHERE status = 'RELEASED'), 0)                                  AS released_all_time,
           COALESCE(SUM(amount)      FILTER (WHERE created_at > now() - interval '30 days'
                                               AND status IN ('RELEASED','HELD_IN_ESCROW')), 0)              AS last30_gross,
           COALESCE(SUM(platform_fee) FILTER (WHERE created_at > now() - interval '30 days'
                                               AND status IN ('RELEASED','HELD_IN_ESCROW')), 0)              AS last30_fees,
           COALESCE(SUM(amount)      FILTER (WHERE type = 'MEMBERSHIP'
                                               AND created_at > now() - interval '30 days'
                                               AND status IN ('RELEASED','HELD_IN_ESCROW')), 0)              AS subscription_mrr,
           COALESCE(SUM(amount)      FILTER (WHERE type = 'LEAD_CREDITS'
                                               AND status IN ('RELEASED','HELD_IN_ESCROW')), 0)              AS credit_revenue
         FROM payments`
      ),
    null
  )

  return {
    grossAllTime: Number(row?.gross_all_time ?? 0),
    feesAllTime: Number(row?.fees_all_time ?? 0),
    heldInEscrow: Number(row?.held_in_escrow ?? 0),
    releasedAllTime: Number(row?.released_all_time ?? 0),
    last30Gross: Number(row?.last30_gross ?? 0),
    last30Fees: Number(row?.last30_fees ?? 0),
    subscriptionMrr: Number(row?.subscription_mrr ?? 0),
    creditRevenue: Number(row?.credit_revenue ?? 0),
  }
}

/** Monthly revenue series for the admin analytics chart. */
export async function revenueByMonth(months = 12): Promise<{ month: string; gross: number; fees: number }[]> {
  return safeRead(
    () =>
      query<{ month: string; gross: number; fees: number }>(
        `SELECT to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
                COALESCE(SUM(amount), 0)       AS gross,
                COALESCE(SUM(platform_fee), 0) AS fees
           FROM payments
          WHERE status IN ('RELEASED','HELD_IN_ESCROW')
            AND created_at > now() - ($1 || ' months')::interval
          GROUP BY date_trunc('month', created_at)
          ORDER BY date_trunc('month', created_at)`,
        [String(months)]
      ),
    []
  )
}
