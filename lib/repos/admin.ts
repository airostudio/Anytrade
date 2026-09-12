import { query, queryOne, safeRead } from '../db'
import type { AuditLogWithActor, ContactEnquiryRow } from '../types'

export interface PlatformStats {
  users: { total: number; clients: number; tradies: number; admins: number; suspended: number; newLast30: number }
  tradies: { verified: number; pendingVerification: number; homegirls: number; paid: number; availableNow: number }
  jobs: {
    total: number
    open: number
    shortlisting: number
    awarded: number
    inProgress: number
    completed: number
    cancelled: number
    newLast30: number
    handyman: number
  }
  bids: { total: number; pending: number; shortlisted: number; accepted: number; avgPerJob: number; avgAmount: number }
  reviews: { total: number; published: number; flagged: number; pending: number; avgRating: number }
  enquiries: { total: number; unhandled: number }
}

export async function platformStats(): Promise<PlatformStats> {
  const row = await safeRead(
    () =>
      queryOne<Record<string, number>>(
        `SELECT
          (SELECT count(*) FROM users)::int                                            AS users_total,
          (SELECT count(*) FROM users WHERE role = 'CLIENT')::int                      AS users_clients,
          (SELECT count(*) FROM users WHERE role = 'TRADESPERSON')::int                AS users_tradies,
          (SELECT count(*) FROM users WHERE role = 'ADMIN')::int                       AS users_admins,
          (SELECT count(*) FROM users WHERE is_suspended)::int                         AS users_suspended,
          (SELECT count(*) FROM users WHERE created_at > now() - interval '30 days')::int AS users_new30,

          (SELECT count(*) FROM tradespeople WHERE verification_status = 'VERIFIED')::int AS tr_verified,
          (SELECT count(*) FROM tradespeople WHERE verification_status = 'PENDING')::int  AS tr_pending,
          (SELECT count(*) FROM tradespeople WHERE is_homegirl)::int                      AS tr_homegirls,
          (SELECT count(*) FROM tradespeople WHERE membership_tier <> 'FREE')::int        AS tr_paid,
          (SELECT count(*) FROM tradespeople WHERE available_now)::int                    AS tr_available,

          (SELECT count(*) FROM jobs)::int                                             AS jobs_total,
          (SELECT count(*) FROM jobs WHERE status = 'OPEN')::int                       AS jobs_open,
          (SELECT count(*) FROM jobs WHERE status = 'SHORTLISTING')::int               AS jobs_shortlisting,
          (SELECT count(*) FROM jobs WHERE status = 'AWARDED')::int                    AS jobs_awarded,
          (SELECT count(*) FROM jobs WHERE status = 'IN_PROGRESS')::int                AS jobs_progress,
          (SELECT count(*) FROM jobs WHERE status = 'COMPLETED')::int                  AS jobs_completed,
          (SELECT count(*) FROM jobs WHERE status = 'CANCELLED')::int                  AS jobs_cancelled,
          (SELECT count(*) FROM jobs WHERE created_at > now() - interval '30 days')::int AS jobs_new30,
          (SELECT count(*) FROM jobs WHERE category = 'handyman' OR job_size = 'ODD_JOB')::int AS jobs_handyman,

          (SELECT count(*) FROM bids)::int                                             AS bids_total,
          (SELECT count(*) FROM bids WHERE status = 'PENDING')::int                    AS bids_pending,
          (SELECT count(*) FROM bids WHERE status = 'SHORTLISTED')::int                AS bids_shortlisted,
          (SELECT count(*) FROM bids WHERE status = 'ACCEPTED')::int                   AS bids_accepted,
          (SELECT COALESCE(avg(bid_count), 0) FROM jobs)                               AS bids_per_job,
          (SELECT COALESCE(avg(amount), 0) FROM bids)                                  AS bids_avg_amount,

          (SELECT count(*) FROM reviews)::int                                          AS rev_total,
          (SELECT count(*) FROM reviews WHERE status = 'PUBLISHED')::int               AS rev_published,
          (SELECT count(*) FROM reviews WHERE is_flagged)::int                         AS rev_flagged,
          (SELECT count(*) FROM reviews WHERE status = 'PENDING_MODERATION')::int      AS rev_pending,
          (SELECT COALESCE(avg(rating), 0) FROM reviews WHERE status = 'PUBLISHED')    AS rev_avg,

          (SELECT count(*) FROM contact_enquiries)::int                                AS enq_total,
          (SELECT count(*) FROM contact_enquiries WHERE NOT is_handled)::int           AS enq_unhandled`
      ),
    null
  )

  const n = (key: string) => Number(row?.[key] ?? 0)

  return {
    users: {
      total: n('users_total'),
      clients: n('users_clients'),
      tradies: n('users_tradies'),
      admins: n('users_admins'),
      suspended: n('users_suspended'),
      newLast30: n('users_new30'),
    },
    tradies: {
      verified: n('tr_verified'),
      pendingVerification: n('tr_pending'),
      homegirls: n('tr_homegirls'),
      paid: n('tr_paid'),
      availableNow: n('tr_available'),
    },
    jobs: {
      total: n('jobs_total'),
      open: n('jobs_open'),
      shortlisting: n('jobs_shortlisting'),
      awarded: n('jobs_awarded'),
      inProgress: n('jobs_progress'),
      completed: n('jobs_completed'),
      cancelled: n('jobs_cancelled'),
      newLast30: n('jobs_new30'),
      handyman: n('jobs_handyman'),
    },
    bids: {
      total: n('bids_total'),
      pending: n('bids_pending'),
      shortlisted: n('bids_shortlisted'),
      accepted: n('bids_accepted'),
      avgPerJob: n('bids_per_job'),
      avgAmount: n('bids_avg_amount'),
    },
    reviews: {
      total: n('rev_total'),
      published: n('rev_published'),
      flagged: n('rev_flagged'),
      pending: n('rev_pending'),
      avgRating: n('rev_avg'),
    },
    enquiries: { total: n('enq_total'), unhandled: n('enq_unhandled') },
  }
}

export async function jobsByCategory(): Promise<{ category: string; n: number; avg_bid: number | null }[]> {
  return safeRead(
    () =>
      query<{ category: string; n: number; avg_bid: number | null }>(
        `SELECT j.category, count(*)::int AS n, avg(b.amount) AS avg_bid
           FROM jobs j LEFT JOIN bids b ON b.job_id = j.id
          GROUP BY j.category ORDER BY n DESC`
      ),
    []
  )
}

export async function signupsByMonth(months = 12) {
  return safeRead(
    () =>
      query<{ month: string; clients: number; tradies: number }>(
        `SELECT to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
                count(*) FILTER (WHERE role = 'CLIENT')::int       AS clients,
                count(*) FILTER (WHERE role = 'TRADESPERSON')::int AS tradies
           FROM users
          WHERE created_at > now() - ($1 || ' months')::interval
          GROUP BY date_trunc('month', created_at)
          ORDER BY date_trunc('month', created_at)`,
        [String(months)]
      ),
    []
  )
}

export async function jobsByMonth(months = 12) {
  return safeRead(
    () =>
      query<{ month: string; posted: number; completed: number }>(
        `SELECT to_char(date_trunc('month', created_at), 'Mon YYYY') AS month,
                count(*)::int                                        AS posted,
                count(*) FILTER (WHERE status = 'COMPLETED')::int    AS completed
           FROM jobs
          WHERE created_at > now() - ($1 || ' months')::interval
          GROUP BY date_trunc('month', created_at)
          ORDER BY date_trunc('month', created_at)`,
        [String(months)]
      ),
    []
  )
}

export async function topTradies(limit = 10) {
  return safeRead(
    () =>
      query<{
        id: string
        slug: string
        business_name: string
        average_rating: number
        total_reviews: number
        completed_jobs: number
        won_bids: number
        membership_tier: string
      }>(
        `SELECT t.id, t.slug, t.business_name, t.average_rating, t.total_reviews,
                t.completed_jobs, t.won_bids, t.membership_tier
           FROM tradespeople t
          ORDER BY t.completed_jobs DESC, t.average_rating DESC
          LIMIT $1`,
        [limit]
      ),
    []
  )
}

export async function topSuburbs(limit = 10) {
  return safeRead(
    () =>
      query<{ suburb: string; state: string; n: number }>(
        `SELECT suburb, state, count(*)::int AS n
           FROM jobs GROUP BY suburb, state ORDER BY n DESC LIMIT $1`,
        [limit]
      ),
    []
  )
}

export async function recordAudit(input: {
  actorId: string | null
  action: string
  entityType?: string
  entityId?: string
  detail?: string
}): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, detail)
       VALUES ($1,$2,$3,$4,$5)`,
      [input.actorId, input.action, input.entityType ?? null, input.entityId ?? null, input.detail ?? null]
    )
  } catch (error) {
    // An audit write must never break the action it is recording.
    console.error('[audit] write failed', error)
  }
}

export async function listAudit(limit = 100): Promise<AuditLogWithActor[]> {
  return safeRead(
    () =>
      query<AuditLogWithActor>(
        `SELECT a.*, u.name AS actor_name, u.email AS actor_email
           FROM audit_log a LEFT JOIN users u ON u.id = a.actor_id
          ORDER BY a.created_at DESC LIMIT $1`,
        [limit]
      ),
    []
  )
}

export async function listEnquiries(limit = 100): Promise<ContactEnquiryRow[]> {
  return safeRead(
    () =>
      query<ContactEnquiryRow>(
        'SELECT * FROM contact_enquiries ORDER BY is_handled ASC, created_at DESC LIMIT $1',
        [limit]
      ),
    []
  )
}

export async function createEnquiry(input: {
  name: string
  email: string
  phone?: string
  subject?: string
  message: string
  suburb?: string
}): Promise<void> {
  await query(
    `INSERT INTO contact_enquiries (name, email, phone, subject, message, suburb)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [input.name, input.email, input.phone ?? null, input.subject ?? null, input.message, input.suburb ?? null]
  )
}

export async function setEnquiryHandled(id: string, handled: boolean): Promise<void> {
  await query(
    `UPDATE contact_enquiries
        SET is_handled = $2, handled_at = CASE WHEN $2 THEN now() ELSE NULL END
      WHERE id = $1`,
    [id, handled]
  )
}
