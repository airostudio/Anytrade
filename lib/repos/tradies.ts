import { query, queryOne, count, safeRead } from '../db'
import type { TradieProfile, TradespersonRow } from '../types'

const PROFILE_SELECT = `
  SELECT t.*,
         u.name       AS name,
         u.email      AS email,
         u.phone      AS user_phone,
         u.avatar_url AS avatar_url,
         u.is_suspended
    FROM tradespeople t
    JOIN users u ON u.id = t.user_id
`

export interface DirectoryFilters {
  trade?: string
  suburb?: string
  postcode?: string
  state?: string
  q?: string
  minRating?: number
  verifiedOnly?: boolean
  homegirlsOnly?: boolean
  availableNow?: boolean
  smallJobsOnly?: boolean
  maxHourlyRate?: number
  sort?: 'recommended' | 'rating' | 'price' | 'experience' | 'reviews'
  limit?: number
  offset?: number
}

/** Builds the shared WHERE clause for directory searches. */
function buildFilters(f: DirectoryFilters): { sql: string; params: unknown[] } {
  const clauses: string[] = ['u.is_suspended = FALSE']
  const params: unknown[] = []
  const add = (value: unknown) => `$${params.push(value)}`

  if (f.trade) clauses.push(`${add(f.trade)} = ANY(t.trades)`)

  if (f.suburb) {
    const p = add(f.suburb)
    clauses.push(`(${p} = ANY(t.service_areas) OR t.base_suburb ILIKE ${p})`)
  }

  if (f.postcode) clauses.push(`t.postcode = ${add(f.postcode)}`)
  if (f.state) clauses.push(`t.state = ${add(f.state)}`)

  if (f.q) {
    const p = add(`%${f.q}%`)
    clauses.push(
      `(t.business_name ILIKE ${p} OR u.name ILIKE ${p} OR t.tagline ILIKE ${p} OR t.bio ILIKE ${p}
        OR EXISTS (SELECT 1 FROM unnest(t.handyman_services) hs WHERE hs ILIKE ${p}))`
    )
  }

  if (f.minRating) clauses.push(`t.average_rating >= ${add(f.minRating)}`)
  if (f.verifiedOnly) clauses.push(`t.verification_status = 'VERIFIED'`)
  if (f.homegirlsOnly) clauses.push('t.is_homegirl = TRUE')
  if (f.availableNow) clauses.push('t.available_now = TRUE')
  if (f.smallJobsOnly) clauses.push('t.accepts_small_jobs = TRUE')
  if (f.maxHourlyRate) clauses.push(`(t.hourly_rate IS NULL OR t.hourly_rate <= ${add(f.maxHourlyRate)})`)

  return { sql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params }
}

function buildOrder(sort: DirectoryFilters['sort']): string {
  switch (sort) {
    case 'rating':
      return 'ORDER BY t.average_rating DESC, t.total_reviews DESC'
    case 'price':
      return 'ORDER BY t.hourly_rate ASC NULLS LAST, t.average_rating DESC'
    case 'experience':
      return 'ORDER BY t.years_experience DESC NULLS LAST, t.completed_jobs DESC'
    case 'reviews':
      return 'ORDER BY t.total_reviews DESC, t.average_rating DESC'
    default:
      // "Recommended": paid tiers and verified tradies first, then reputation.
      return `ORDER BY t.is_featured DESC,
                       CASE t.membership_tier
                         WHEN 'MASTER' THEN 4 WHEN 'GUVNOR' THEN 3
                         WHEN 'SUBBIE' THEN 2 ELSE 1 END DESC,
                       (t.verification_status = 'VERIFIED') DESC,
                       t.average_rating DESC,
                       t.completed_jobs DESC`
  }
}

export async function searchTradies(f: DirectoryFilters = {}): Promise<TradieProfile[]> {
  const { sql, params } = buildFilters(f)
  const limit = f.limit ?? 24
  const offset = f.offset ?? 0
  return safeRead(
    () =>
      query<TradieProfile>(
        `${PROFILE_SELECT} ${sql} ${buildOrder(f.sort)} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
    []
  )
}

export async function countTradies(f: DirectoryFilters = {}): Promise<number> {
  const { sql, params } = buildFilters(f)
  return safeRead(
    () =>
      count(
        `SELECT count(*) FROM tradespeople t JOIN users u ON u.id = t.user_id ${sql}`,
        params
      ),
    0
  )
}

export async function getTradieBySlug(slug: string): Promise<TradieProfile | null> {
  return safeRead(
    () => queryOne<TradieProfile>(`${PROFILE_SELECT} WHERE t.slug = $1`, [slug]),
    null
  )
}

export async function getTradieById(id: string): Promise<TradieProfile | null> {
  return safeRead(() => queryOne<TradieProfile>(`${PROFILE_SELECT} WHERE t.id = $1`, [id]), null)
}

export async function getTradieByUserId(userId: string): Promise<TradieProfile | null> {
  return safeRead(
    () => queryOne<TradieProfile>(`${PROFILE_SELECT} WHERE t.user_id = $1`, [userId]),
    null
  )
}

export async function recordProfileView(id: string): Promise<void> {
  await query('UPDATE tradespeople SET profile_views = profile_views + 1 WHERE id = $1', [id])
}

/** Per-category counts for the directory sidebar and the trades index page. */
export async function countsByTrade(): Promise<Record<string, number>> {
  const rows = await safeRead(
    () =>
      query<{ trade: string; count: number }>(
        `SELECT trade, count(*)::int AS count
           FROM tradespeople t
           JOIN users u ON u.id = t.user_id,
                LATERAL unnest(t.trades) AS trade
          WHERE u.is_suspended = FALSE
          GROUP BY trade`
      ),
    []
  )
  return Object.fromEntries(rows.map((r) => [r.trade, Number(r.count)]))
}

/** Suburbs with the most listed tradies — used for "we cover" links. */
export async function topServiceAreas(limit = 18): Promise<{ suburb: string; count: number }[]> {
  return safeRead(
    () =>
      query<{ suburb: string; count: number }>(
        `SELECT area AS suburb, count(*)::int AS count
           FROM tradespeople t
           JOIN users u ON u.id = t.user_id,
                LATERAL unnest(t.service_areas) AS area
          WHERE u.is_suspended = FALSE
          GROUP BY area
          ORDER BY count DESC, area ASC
          LIMIT $1`,
        [limit]
      ),
    []
  )
}

export interface TradieUpdate {
  business_name?: string
  tagline?: string | null
  bio?: string | null
  trades?: string[]
  handyman_services?: string[]
  accepts_small_jobs?: boolean
  hourly_rate?: number | null
  callout_fee?: number | null
  minimum_charge?: number | null
  free_quotes?: boolean
  service_areas?: string[]
  base_suburb?: string | null
  city?: string | null
  state?: string | null
  postcode?: string | null
  travel_radius_km?: number
  available_now?: boolean
  available_weekends?: boolean
  emergency_callouts?: boolean
  years_experience?: number | null
  abn?: string | null
  licence_number?: string | null
  insurer_name?: string | null
  is_homegirl?: boolean
}

/** Partial update — only the keys present are written. */
export async function updateTradie(id: string, patch: TradieUpdate): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined)
  if (!entries.length) return

  const sets = entries.map(([key], i) => `${key} = $${i + 2}`)
  await query(`UPDATE tradespeople SET ${sets.join(', ')} WHERE id = $1`, [
    id,
    ...entries.map(([, v]) => v),
  ])
}

/**
 * Recompute a tradie's rating aggregates from their published reviews.
 * Called after any review is created, hidden or restored.
 */
export async function refreshTradieRatings(tradespersonId: string): Promise<void> {
  await query(
    `UPDATE tradespeople t
        SET average_rating       = COALESCE(r.avg_overall, 0),
            total_reviews        = COALESCE(r.n, 0),
            rating_quality       = COALESCE(r.avg_quality, 0),
            rating_punctuality   = COALESCE(r.avg_punctuality, 0),
            rating_value         = COALESCE(r.avg_value, 0),
            rating_communication = COALESCE(r.avg_communication, 0),
            rating_tidiness      = COALESCE(r.avg_tidiness, 0)
       FROM (
         SELECT count(*)                    AS n,
                avg(rating)                 AS avg_overall,
                avg(rating_quality)         AS avg_quality,
                avg(rating_punctuality)     AS avg_punctuality,
                avg(rating_value)           AS avg_value,
                avg(rating_communication)   AS avg_communication,
                avg(rating_tidiness)        AS avg_tidiness
           FROM reviews
          WHERE tradesperson_id = $1
            AND direction = 'CLIENT_TO_TRADIE'
            AND status = 'PUBLISHED'
       ) r
      WHERE t.id = $1`,
    [tradespersonId]
  )
}

/** Same idea for a client's rideshare-style rating, built from tradie reviews. */
export async function refreshClientRating(userId: string): Promise<void> {
  await query(
    `UPDATE users u
        SET client_rating       = COALESCE(r.avg_overall, 0),
            client_review_count = COALESCE(r.n, 0)
       FROM (
         SELECT count(*) AS n, avg(rating) AS avg_overall
           FROM reviews
          WHERE reviewee_id = $1
            AND direction = 'TRADIE_TO_CLIENT'
            AND status = 'PUBLISHED'
       ) r
      WHERE u.id = $1`,
    [userId]
  )
}

export async function adjustCredits(
  tradespersonId: string,
  delta: number,
  reason: string,
  note?: string,
  jobId?: string,
  paymentId?: string
): Promise<number> {
  const row = await queryOne<{ lead_credits: number }>(
    'UPDATE tradespeople SET lead_credits = GREATEST(0, lead_credits + $2) WHERE id = $1 RETURNING lead_credits',
    [tradespersonId, delta]
  )
  const balance = row?.lead_credits ?? 0

  await query(
    `INSERT INTO credit_ledger (tradesperson_id, delta, balance_after, reason, note, job_id, payment_id)
     VALUES ($1, $2, $3, $4::credit_reason, $5, $6, $7)`,
    [tradespersonId, delta, balance, reason, note ?? null, jobId ?? null, paymentId ?? null]
  )
  return balance
}

export async function creditHistory(tradespersonId: string, limit = 40) {
  return safeRead(
    () =>
      query(
        `SELECT * FROM credit_ledger WHERE tradesperson_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [tradespersonId, limit]
      ),
    []
  )
}

export async function listAllTradies(limit = 200): Promise<TradieProfile[]> {
  return safeRead(
    () => query<TradieProfile>(`${PROFILE_SELECT} ORDER BY t.created_at DESC LIMIT $1`, [limit]),
    []
  )
}

export async function slugExists(slug: string): Promise<boolean> {
  const row = await queryOne<TradespersonRow>('SELECT id FROM tradespeople WHERE slug = $1', [slug])
  return Boolean(row)
}
