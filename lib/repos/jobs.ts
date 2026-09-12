import { query, queryOne, count, safeRead, transaction } from '../db'
import type { JobRow, JobStatus, JobWithClient } from '../types'
import { jobReference } from '../utils'

const JOB_SELECT = `
  SELECT j.*,
         u.name                AS client_name,
         u.email               AS client_email,
         u.client_rating       AS client_rating,
         u.client_review_count AS client_review_count,
         u.suburb              AS client_suburb
    FROM jobs j
    JOIN users u ON u.id = j.client_id
`

export interface JobFilters {
  category?: string
  suburb?: string
  postcode?: string
  state?: string
  q?: string
  status?: JobStatus | JobStatus[]
  jobSize?: string
  urgency?: string
  minBudget?: number
  homegirlsOnly?: boolean
  clientId?: string
  /** Hide jobs already at their bid cap. */
  openForBids?: boolean
  sort?: 'newest' | 'budget' | 'closing' | 'fewest_bids'
  limit?: number
  offset?: number
}

function buildFilters(f: JobFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = []
  const params: unknown[] = []
  const add = (value: unknown) => `$${params.push(value)}`

  if (f.status) {
    const statuses = Array.isArray(f.status) ? f.status : [f.status]
    clauses.push(`j.status = ANY(${add(statuses)}::job_status[])`)
  }
  if (f.category) clauses.push(`j.category = ${add(f.category)}`)
  if (f.suburb) clauses.push(`j.suburb ILIKE ${add(f.suburb)}`)
  if (f.postcode) clauses.push(`j.postcode = ${add(f.postcode)}`)
  if (f.state) clauses.push(`j.state = ${add(f.state)}`)
  if (f.jobSize) clauses.push(`j.job_size = ${add(f.jobSize)}::job_size`)
  if (f.urgency) clauses.push(`j.urgency = ${add(f.urgency)}::job_urgency`)
  if (f.minBudget) clauses.push(`COALESCE(j.budget_max, j.budget_min, 0) >= ${add(f.minBudget)}`)
  if (f.homegirlsOnly) clauses.push('j.prefer_homegirl = TRUE')
  if (f.clientId) clauses.push(`j.client_id = ${add(f.clientId)}`)
  if (f.openForBids) clauses.push('j.bid_count < j.max_bids')

  if (f.q) {
    const p = add(`%${f.q}%`)
    clauses.push(`(j.title ILIKE ${p} OR j.description ILIKE ${p} OR j.suburb ILIKE ${p} OR j.reference ILIKE ${p})`)
  }

  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params }
}

function buildOrder(sort: JobFilters['sort']): string {
  switch (sort) {
    case 'budget':
      return 'ORDER BY COALESCE(j.budget_max, j.budget_min, 0) DESC, j.created_at DESC'
    case 'closing':
      return 'ORDER BY j.bids_close_at ASC NULLS LAST, j.created_at DESC'
    case 'fewest_bids':
      return 'ORDER BY j.bid_count ASC, j.created_at DESC'
    default:
      return `ORDER BY (j.urgency = 'EMERGENCY') DESC, j.created_at DESC`
  }
}

export async function searchJobs(f: JobFilters = {}): Promise<JobWithClient[]> {
  const { sql, params } = buildFilters(f)
  const limit = f.limit ?? 20
  const offset = f.offset ?? 0
  return safeRead(
    () =>
      query<JobWithClient>(
        `${JOB_SELECT} ${sql} ${buildOrder(f.sort)} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    []
  )
}

export async function countJobs(f: JobFilters = {}): Promise<number> {
  const { sql, params } = buildFilters(f)
  return safeRead(
    () => count(`SELECT count(*) FROM jobs j JOIN users u ON u.id = j.client_id ${sql}`, params),
    0
  )
}

export async function getJob(id: string): Promise<JobWithClient | null> {
  return safeRead(() => queryOne<JobWithClient>(`${JOB_SELECT} WHERE j.id = $1`, [id]), null)
}

export async function getJobByReference(reference: string): Promise<JobWithClient | null> {
  return safeRead(
    () => queryOne<JobWithClient>(`${JOB_SELECT} WHERE j.reference = $1`, [reference]),
    null
  )
}

export interface NewJob {
  clientId: string
  title: string
  description: string
  category: string
  budgetMin: number | null
  budgetMax: number | null
  jobSize: string
  urgency: string
  address: string | null
  suburb: string
  city: string
  state: string
  postcode: string
  preferredDate: string | null
  preferHomegirl: boolean
  maxBids: number
  bidWindowDays: number
}

export async function createJob(input: NewJob): Promise<JobRow> {
  // Reference collisions are vanishingly rare but cheap to retry.
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = jobReference()
    const existing = await queryOne<JobRow>('SELECT id FROM jobs WHERE reference = $1', [reference])
    if (existing) continue

    const row = await queryOne<JobRow>(
      `INSERT INTO jobs (reference, client_id, title, description, category,
                         budget_min, budget_max, job_size, urgency,
                         address, suburb, city, state, postcode,
                         preferred_date, prefer_homegirl, max_bids, bids_close_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::job_size,$9::job_urgency,
               $10,$11,$12,$13,$14,$15,$16,$17, now() + ($18 || ' days')::interval, 'OPEN')
       RETURNING *`,
      [
        reference,
        input.clientId,
        input.title,
        input.description,
        input.category,
        input.budgetMin,
        input.budgetMax,
        input.jobSize,
        input.urgency,
        input.address,
        input.suburb,
        input.city,
        input.state,
        input.postcode,
        input.preferredDate,
        input.preferHomegirl,
        input.maxBids,
        String(input.bidWindowDays),
      ]
    )
    if (row) return row
  }
  throw new Error('Could not allocate a job reference. Please try again.')
}

export async function recordJobView(id: string): Promise<void> {
  await query('UPDATE jobs SET view_count = view_count + 1 WHERE id = $1', [id])
}

export async function updateJobStatus(
  id: string,
  status: JobStatus,
  extra: { cancelReason?: string } = {}
): Promise<void> {
  await query(
    `UPDATE jobs
        SET status = $2::job_status,
            completed_at  = CASE WHEN $2 = 'COMPLETED' THEN now() ELSE completed_at END,
            cancelled_at  = CASE WHEN $2 = 'CANCELLED' THEN now() ELSE cancelled_at END,
            cancel_reason = COALESCE($3, cancel_reason)
      WHERE id = $1`,
    [id, status, extra.cancelReason ?? null]
  )
}

/**
 * Award the job to one bid: that bid is accepted, every other live bid is
 * declined and the job moves to AWARDED. Done in one transaction so a client
 * can never end up with two accepted bids.
 */
export async function awardJob(jobId: string, bidId: string): Promise<void> {
  await transaction(async (client) => {
    await client.query(
      `UPDATE bids SET status = 'ACCEPTED', accepted_at = now(), is_shortlisted = TRUE
        WHERE id = $1 AND job_id = $2`,
      [bidId, jobId]
    )
    await client.query(
      `UPDATE bids SET status = 'DECLINED', declined_at = now()
        WHERE job_id = $1 AND id <> $2 AND status IN ('PENDING','SHORTLISTED')`,
      [jobId, bidId]
    )
    await client.query(
      `UPDATE jobs SET status = 'AWARDED', accepted_bid_id = $2, awarded_at = now() WHERE id = $1`,
      [jobId, bidId]
    )
    await client.query(
      `UPDATE tradespeople t
          SET won_bids = won_bids + 1
         FROM bids b
        WHERE b.id = $1 AND t.id = b.tradesperson_id`,
      [bidId]
    )
  })
}

/** Mark a job finished and credit the winning tradie's completed count. */
export async function completeJob(jobId: string): Promise<void> {
  await transaction(async (client) => {
    await client.query(
      `UPDATE jobs SET status = 'COMPLETED', completed_at = now() WHERE id = $1`,
      [jobId]
    )
    await client.query(
      `UPDATE tradespeople t
          SET completed_jobs = completed_jobs + 1
         FROM bids b
        WHERE b.job_id = $1 AND b.status = 'ACCEPTED' AND t.id = b.tradesperson_id`,
      [jobId]
    )
  })
}

export async function jobsForClient(clientId: string, limit = 50): Promise<JobWithClient[]> {
  return safeRead(
    () =>
      query<JobWithClient>(`${JOB_SELECT} WHERE j.client_id = $1 ORDER BY j.created_at DESC LIMIT $2`, [
        clientId,
        limit,
      ]),
    []
  )
}

/** Jobs a tradie has won, newest first. */
export async function jobsForTradie(tradespersonId: string, limit = 50): Promise<JobWithClient[]> {
  return safeRead(
    () =>
      query<JobWithClient>(
        `${JOB_SELECT}
         JOIN bids b ON b.job_id = j.id AND b.tradesperson_id = $1 AND b.status = 'ACCEPTED'
         ORDER BY j.created_at DESC LIMIT $2`,
        [tradespersonId, limit]
      ),
    []
  )
}

/**
 * The tradie's lead feed: open jobs in their trades and service areas that
 * they have not already bid on and that still have room for bids.
 */
export async function leadsForTradie(
  tradespersonId: string,
  opts: { limit?: number; category?: string; q?: string; ignoreAreas?: boolean } = {}
): Promise<JobWithClient[]> {
  const params: unknown[] = [tradespersonId]
  const extra: string[] = []
  const add = (value: unknown) => `$${params.push(value)}`

  if (opts.category) extra.push(`AND j.category = ${add(opts.category)}`)
  if (opts.q) {
    const p = add(`%${opts.q}%`)
    extra.push(`AND (j.title ILIKE ${p} OR j.description ILIKE ${p} OR j.suburb ILIKE ${p})`)
  }

  const areaClause = opts.ignoreAreas
    ? ''
    : `AND (t.service_areas = '{}' OR j.suburb = ANY(t.service_areas) OR j.state = t.state)`

  return safeRead(
    () =>
      query<JobWithClient>(
        `${JOB_SELECT}
          JOIN tradespeople t ON t.id = $1
         WHERE j.status IN ('OPEN','SHORTLISTING')
           AND j.bid_count < j.max_bids
           AND j.category = ANY(t.trades)
           AND (j.prefer_homegirl = FALSE OR t.is_homegirl = TRUE)
           AND NOT EXISTS (SELECT 1 FROM bids b WHERE b.job_id = j.id AND b.tradesperson_id = t.id)
           ${areaClause}
           ${extra.join(' ')}
         ORDER BY (j.urgency = 'EMERGENCY') DESC, j.created_at DESC
         LIMIT ${add(opts.limit ?? 30)}`,
        params
      ),
    []
  )
}

export async function recentJobs(limit = 8): Promise<JobWithClient[]> {
  return safeRead(
    () =>
      query<JobWithClient>(
        `${JOB_SELECT} WHERE j.status IN ('OPEN','SHORTLISTING') ORDER BY j.created_at DESC LIMIT $1`,
        [limit]
      ),
    []
  )
}

export async function listAllJobs(limit = 200): Promise<JobWithClient[]> {
  return safeRead(
    () => query<JobWithClient>(`${JOB_SELECT} ORDER BY j.created_at DESC LIMIT $1`, [limit]),
    []
  )
}
