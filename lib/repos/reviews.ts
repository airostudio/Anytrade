import { query, queryOne, safeRead } from '../db'
import type { ReviewDirection, ReviewRow, ReviewStatus, ReviewWithPeople } from '../types'
import { refreshClientRating, refreshTradieRatings } from './tradies'

const REVIEW_SELECT = `
  SELECT r.*,
         rev.name   AS reviewer_name,
         rev.suburb AS reviewer_suburb,
         te.name    AS reviewee_name,
         j.title     AS job_title,
         j.reference AS job_reference,
         j.category  AS job_category,
         t.business_name,
         t.slug
    FROM reviews r
    JOIN users rev ON rev.id = r.reviewer_id
    JOIN users te  ON te.id  = r.reviewee_id
    JOIN jobs j    ON j.id   = r.job_id
    LEFT JOIN tradespeople t ON t.id = r.tradesperson_id
`

export async function reviewsForTradie(
  tradespersonId: string,
  limit = 30
): Promise<ReviewWithPeople[]> {
  return safeRead(
    () =>
      query<ReviewWithPeople>(
        `${REVIEW_SELECT}
          WHERE r.tradesperson_id = $1
            AND r.direction = 'CLIENT_TO_TRADIE'
            AND r.status = 'PUBLISHED'
          ORDER BY r.created_at DESC LIMIT $2`,
        [tradespersonId, limit]
      ),
    []
  )
}

/** Reviews a user has received in either direction — used on dashboards. */
export async function reviewsForUser(userId: string, limit = 30): Promise<ReviewWithPeople[]> {
  return safeRead(
    () =>
      query<ReviewWithPeople>(
        `${REVIEW_SELECT} WHERE r.reviewee_id = $1 AND r.status = 'PUBLISHED'
          ORDER BY r.created_at DESC LIMIT $2`,
        [userId, limit]
      ),
    []
  )
}

export async function reviewsForJob(jobId: string): Promise<ReviewWithPeople[]> {
  return safeRead(
    () => query<ReviewWithPeople>(`${REVIEW_SELECT} WHERE r.job_id = $1`, [jobId]),
    []
  )
}

export async function getReview(id: string): Promise<ReviewWithPeople | null> {
  return safeRead(() => queryOne<ReviewWithPeople>(`${REVIEW_SELECT} WHERE r.id = $1`, [id]), null)
}

export async function hasReviewed(
  jobId: string,
  reviewerId: string,
  direction: ReviewDirection
): Promise<boolean> {
  const row = await safeRead(
    () =>
      queryOne<{ id: string }>(
        'SELECT id FROM reviews WHERE job_id = $1 AND reviewer_id = $2 AND direction = $3::review_direction',
        [jobId, reviewerId, direction]
      ),
    null
  )
  return Boolean(row)
}

export interface NewReview {
  jobId: string
  direction: ReviewDirection
  reviewerId: string
  revieweeId: string
  tradespersonId: string | null
  rating: number
  comment: string | null
  tags: string[]
  quality?: number | null
  punctuality?: number | null
  value?: number | null
  communication?: number | null
  tidiness?: number | null
  status?: ReviewStatus
}

export async function createReview(input: NewReview): Promise<ReviewRow | null> {
  const row = await queryOne<ReviewRow>(
    `INSERT INTO reviews (job_id, direction, reviewer_id, reviewee_id, tradesperson_id,
                          rating, comment, tags, rating_quality, rating_punctuality,
                          rating_value, rating_communication, rating_tidiness, status)
     VALUES ($1,$2::review_direction,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::review_status)
     ON CONFLICT (job_id, reviewer_id, direction) DO NOTHING
     RETURNING *`,
    [
      input.jobId,
      input.direction,
      input.reviewerId,
      input.revieweeId,
      input.tradespersonId,
      input.rating,
      input.comment,
      input.tags,
      input.quality ?? null,
      input.punctuality ?? null,
      input.value ?? null,
      input.communication ?? null,
      input.tidiness ?? null,
      input.status ?? 'PUBLISHED',
    ]
  )

  if (!row) return null

  // Keep the denormalised averages in step with the new review.
  if (input.direction === 'CLIENT_TO_TRADIE' && input.tradespersonId) {
    await refreshTradieRatings(input.tradespersonId)
  } else {
    await refreshClientRating(input.revieweeId)
  }

  return row
}

export async function respondToReview(
  reviewId: string,
  tradespersonId: string,
  response: string
): Promise<boolean> {
  const row = await queryOne<ReviewRow>(
    `UPDATE reviews SET response = $3, responded_at = now()
      WHERE id = $1 AND tradesperson_id = $2 RETURNING *`,
    [reviewId, tradespersonId, response]
  )
  return Boolean(row)
}

export async function moderateReview(
  reviewId: string,
  status: ReviewStatus,
  note?: string
): Promise<void> {
  const row = await queryOne<ReviewRow>(
    `UPDATE reviews
        SET status = $2::review_status, moderated_at = now(), moderator_note = COALESCE($3, moderator_note),
            is_flagged = CASE WHEN $2 = 'PUBLISHED' THEN FALSE ELSE is_flagged END
      WHERE id = $1 RETURNING *`,
    [reviewId, status, note ?? null]
  )
  if (!row) return
  if (row.tradesperson_id) await refreshTradieRatings(row.tradesperson_id)
  else await refreshClientRating(row.reviewee_id)
}

export async function flagReview(reviewId: string, reason: string): Promise<void> {
  await query('UPDATE reviews SET is_flagged = TRUE, flag_reason = $2 WHERE id = $1', [
    reviewId,
    reason,
  ])
}

/** Star distribution (5 → 1) for the bar chart on a tradie profile. */
export async function ratingBreakdown(tradespersonId: string): Promise<Record<number, number>> {
  const rows = await safeRead(
    () =>
      query<{ rating: number; n: number }>(
        `SELECT rating, count(*)::int AS n
           FROM reviews
          WHERE tradesperson_id = $1 AND direction = 'CLIENT_TO_TRADIE' AND status = 'PUBLISHED'
          GROUP BY rating`,
        [tradespersonId]
      ),
    []
  )
  const out: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const row of rows) out[Number(row.rating)] = Number(row.n)
  return out
}

/** Most-awarded compliment tags, for the "what people say" strip. */
export async function topTags(tradespersonId: string, limit = 6): Promise<{ tag: string; n: number }[]> {
  return safeRead(
    () =>
      query<{ tag: string; n: number }>(
        `SELECT tag, count(*)::int AS n
           FROM reviews r, LATERAL unnest(r.tags) AS tag
          WHERE r.tradesperson_id = $1 AND r.status = 'PUBLISHED'
          GROUP BY tag ORDER BY n DESC, tag ASC LIMIT $2`,
        [tradespersonId, limit]
      ),
    []
  )
}

export async function recentPublishedReviews(limit = 6): Promise<ReviewWithPeople[]> {
  return safeRead(
    () =>
      query<ReviewWithPeople>(
        `${REVIEW_SELECT}
          WHERE r.status = 'PUBLISHED' AND r.direction = 'CLIENT_TO_TRADIE' AND r.comment IS NOT NULL
          ORDER BY r.created_at DESC LIMIT $1`,
        [limit]
      ),
    []
  )
}

export async function listAllReviews(limit = 200): Promise<ReviewWithPeople[]> {
  return safeRead(
    () => query<ReviewWithPeople>(`${REVIEW_SELECT} ORDER BY r.created_at DESC LIMIT $1`, [limit]),
    []
  )
}

/**
 * Jobs a user still owes a rating on. Powers the "rate your tradie" and
 * "rate your customer" prompts that keep the two-way system honest.
 */
export async function pendingReviewsFor(
  userId: string,
  role: 'CLIENT' | 'TRADESPERSON'
): Promise<{ job_id: string; title: string; reference: string; other_name: string; completed_at: Date | null }[]> {
  const direction: ReviewDirection = role === 'CLIENT' ? 'CLIENT_TO_TRADIE' : 'TRADIE_TO_CLIENT'

  const sql =
    role === 'CLIENT'
      ? `SELECT j.id AS job_id, j.title, j.reference, tu.name AS other_name, j.completed_at
           FROM jobs j
           JOIN bids b  ON b.job_id = j.id AND b.status = 'ACCEPTED'
           JOIN tradespeople t ON t.id = b.tradesperson_id
           JOIN users tu ON tu.id = t.user_id
          WHERE j.client_id = $1 AND j.status = 'COMPLETED'
            AND NOT EXISTS (
              SELECT 1 FROM reviews r
               WHERE r.job_id = j.id AND r.reviewer_id = $1 AND r.direction = $2::review_direction)
          ORDER BY j.completed_at DESC`
      : `SELECT j.id AS job_id, j.title, j.reference, cu.name AS other_name, j.completed_at
           FROM jobs j
           JOIN bids b ON b.job_id = j.id AND b.status = 'ACCEPTED'
           JOIN users cu ON cu.id = j.client_id
          WHERE b.user_id = $1 AND j.status = 'COMPLETED'
            AND NOT EXISTS (
              SELECT 1 FROM reviews r
               WHERE r.job_id = j.id AND r.reviewer_id = $1 AND r.direction = $2::review_direction)
          ORDER BY j.completed_at DESC`

  return safeRead(() => query(sql, [userId, direction]), [])
}
