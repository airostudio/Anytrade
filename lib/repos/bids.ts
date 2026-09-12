import { query, queryOne, safeRead, transaction } from '../db'
import type { BidRow, BidWithJob, BidWithTradie } from '../types'

const BID_WITH_TRADIE = `
  SELECT b.*,
         t.slug, t.business_name, t.logo_url, t.average_rating, t.total_reviews,
         t.completed_jobs, t.verification_status, t.is_homegirl, t.years_experience,
         t.base_suburb, t.membership_tier,
         u.name AS tradie_name
    FROM bids b
    JOIN tradespeople t ON t.id = b.tradesperson_id
    JOIN users u ON u.id = t.user_id
`

const BID_WITH_JOB = `
  SELECT b.*,
         j.title      AS job_title,
         j.reference  AS job_reference,
         j.status     AS job_status,
         j.suburb     AS job_suburb,
         j.category   AS job_category,
         j.budget_min AS job_budget_min,
         j.budget_max AS job_budget_max
    FROM bids b
    JOIN jobs j ON j.id = b.job_id
`

export async function bidsForJob(jobId: string): Promise<BidWithTradie[]> {
  return safeRead(
    () =>
      query<BidWithTradie>(
        `${BID_WITH_TRADIE}
          WHERE b.job_id = $1 AND b.status <> 'WITHDRAWN'
          ORDER BY b.is_shortlisted DESC,
                   CASE b.status WHEN 'ACCEPTED' THEN 0 ELSE 1 END,
                   b.amount ASC`,
        [jobId]
      ),
    []
  )
}

export async function getBid(id: string): Promise<BidWithTradie | null> {
  return safeRead(() => queryOne<BidWithTradie>(`${BID_WITH_TRADIE} WHERE b.id = $1`, [id]), null)
}

export async function getBidForJobAndTradie(
  jobId: string,
  tradespersonId: string
): Promise<BidRow | null> {
  return safeRead(
    () =>
      queryOne<BidRow>('SELECT * FROM bids WHERE job_id = $1 AND tradesperson_id = $2', [
        jobId,
        tradespersonId,
      ]),
    null
  )
}

export async function bidsForTradie(tradespersonId: string, limit = 60): Promise<BidWithJob[]> {
  return safeRead(
    () =>
      query<BidWithJob>(
        `${BID_WITH_JOB} WHERE b.tradesperson_id = $1 ORDER BY b.created_at DESC LIMIT $2`,
        [tradespersonId, limit]
      ),
    []
  )
}

export interface NewBid {
  jobId: string
  tradespersonId: string
  userId: string
  amount: number
  message: string
  estimatedDays: number | null
  estimatedHours: number | null
  includesMaterials: boolean
  includesGst: boolean
  availableFrom: string | null
  warrantyMonths: number | null
  creditsSpent: number
}

/**
 * Place a bid and charge the tradie's lead credits in one transaction.
 *
 * The insert is guarded by the job still being open and under its bid cap, so
 * two tradies racing for the last slot cannot both get in.
 */
export async function placeBid(input: NewBid): Promise<{ ok: true; bid: BidRow } | { ok: false; error: string }> {
  try {
    return await transaction(async (client) => {
      const job = await client.query(
        `SELECT id, status, bid_count, max_bids FROM jobs WHERE id = $1 FOR UPDATE`,
        [input.jobId]
      )
      const jobRow = job.rows[0]
      if (!jobRow) return { ok: false as const, error: 'That job no longer exists.' }
      if (!['OPEN', 'SHORTLISTING'].includes(jobRow.status)) {
        return { ok: false as const, error: 'This job is no longer taking quotes.' }
      }
      if (jobRow.bid_count >= jobRow.max_bids) {
        return { ok: false as const, error: 'This job already has the maximum number of quotes.' }
      }

      const tradie = await client.query(
        'SELECT id, lead_credits FROM tradespeople WHERE id = $1 FOR UPDATE',
        [input.tradespersonId]
      )
      const tradieRow = tradie.rows[0]
      if (!tradieRow) return { ok: false as const, error: 'Tradie profile not found.' }
      if (tradieRow.lead_credits < input.creditsSpent) {
        return {
          ok: false as const,
          error: `You need ${input.creditsSpent} lead credit${input.creditsSpent === 1 ? '' : 's'} to quote on this job. Top up in Billing.`,
        }
      }

      const inserted = await client.query<BidRow>(
        `INSERT INTO bids (job_id, tradesperson_id, user_id, amount, message, estimated_days,
                           estimated_hours, includes_materials, includes_gst, available_from,
                           warranty_months, credits_spent)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         ON CONFLICT (job_id, tradesperson_id) DO NOTHING
         RETURNING *`,
        [
          input.jobId,
          input.tradespersonId,
          input.userId,
          input.amount,
          input.message,
          input.estimatedDays,
          input.estimatedHours,
          input.includesMaterials,
          input.includesGst,
          input.availableFrom,
          input.warrantyMonths,
          input.creditsSpent,
        ]
      )
      const bid = inserted.rows[0]
      if (!bid) return { ok: false as const, error: 'You have already quoted on this job.' }

      const balance = tradieRow.lead_credits - input.creditsSpent
      await client.query(
        'UPDATE tradespeople SET lead_credits = $2, total_bids = total_bids + 1 WHERE id = $1',
        [input.tradespersonId, balance]
      )
      await client.query(
        `INSERT INTO credit_ledger (tradesperson_id, delta, balance_after, reason, note, job_id)
         VALUES ($1, $2, $3, 'BID_UNLOCK', $4, $5)`,
        [input.tradespersonId, -input.creditsSpent, balance, 'Quote submitted', input.jobId]
      )
      await client.query('UPDATE jobs SET bid_count = bid_count + 1 WHERE id = $1', [input.jobId])

      return { ok: true as const, bid }
    })
  } catch (error) {
    console.error('[bids] placeBid failed', error)
    return { ok: false, error: 'Could not submit your quote. Please try again.' }
  }
}

export async function shortlistBid(bidId: string, shortlisted: boolean): Promise<void> {
  await query(
    `UPDATE bids
        SET is_shortlisted = $2,
            shortlisted_at = CASE WHEN $2 THEN now() ELSE NULL END,
            status = CASE
                       WHEN $2 AND status = 'PENDING' THEN 'SHORTLISTED'::bid_status
                       WHEN NOT $2 AND status = 'SHORTLISTED' THEN 'PENDING'::bid_status
                       ELSE status
                     END
      WHERE id = $1`,
    [bidId, shortlisted]
  )
}

export async function declineBid(bidId: string): Promise<void> {
  await query(
    `UPDATE bids SET status = 'DECLINED', declined_at = now(), is_shortlisted = FALSE
      WHERE id = $1 AND status IN ('PENDING','SHORTLISTED')`,
    [bidId]
  )
}

export async function withdrawBid(bidId: string, tradespersonId: string): Promise<void> {
  await transaction(async (client) => {
    const res = await client.query(
      `UPDATE bids SET status = 'WITHDRAWN', withdrawn_at = now()
        WHERE id = $1 AND tradesperson_id = $2 AND status IN ('PENDING','SHORTLISTED')
        RETURNING job_id`,
      [bidId, tradespersonId]
    )
    if (res.rows[0]) {
      await client.query('UPDATE jobs SET bid_count = GREATEST(0, bid_count - 1) WHERE id = $1', [
        res.rows[0].job_id,
      ])
    }
  })
}

export async function markBidsSeen(jobId: string): Promise<void> {
  await query('UPDATE bids SET seen_by_client = TRUE WHERE job_id = $1 AND seen_by_client = FALSE', [
    jobId,
  ])
}

/** Headline numbers shown above the bid comparison table. */
export interface BidStats {
  total: number
  lowest: number | null
  highest: number | null
  average: number | null
}

export async function bidStats(jobId: string): Promise<BidStats> {
  const row = await safeRead(
    () =>
      queryOne<{ total: number; lowest: number | null; highest: number | null; average: number | null }>(
        `SELECT count(*)::int AS total, min(amount) AS lowest, max(amount) AS highest, avg(amount) AS average
           FROM bids WHERE job_id = $1 AND status <> 'WITHDRAWN'`,
        [jobId]
      ),
    null
  )
  return {
    total: Number(row?.total ?? 0),
    lowest: row?.lowest ?? null,
    highest: row?.highest ?? null,
    average: row?.average ?? null,
  }
}

/** Market context for the job board: what similar jobs are going for. */
export async function categoryBidAverage(category: string): Promise<number | null> {
  const row = await safeRead(
    () =>
      queryOne<{ average: number | null }>(
        `SELECT avg(b.amount) AS average
           FROM bids b JOIN jobs j ON j.id = b.job_id
          WHERE j.category = $1 AND b.status <> 'WITHDRAWN'`,
        [category]
      ),
    null
  )
  return row?.average ?? null
}

export async function listAllBids(limit = 200): Promise<(BidWithJob & { business_name: string })[]> {
  return safeRead(
    () =>
      query<BidWithJob & { business_name: string }>(
        `SELECT b.*,
                t.business_name,
                j.title      AS job_title,
                j.reference  AS job_reference,
                j.status     AS job_status,
                j.suburb     AS job_suburb,
                j.category   AS job_category,
                j.budget_min AS job_budget_min,
                j.budget_max AS job_budget_max
           FROM bids b
           JOIN jobs j ON j.id = b.job_id
           JOIN tradespeople t ON t.id = b.tradesperson_id
          ORDER BY b.created_at DESC
          LIMIT $1`,
        [limit]
      ),
    []
  )
}
