import { query, queryOne, safeRead } from '../db'
import type {
  HomegirlsMemberRow,
  HomegirlsMemberWithTradie,
  HomegirlsPostRow,
  HomegirlsPostWithAuthor,
  HomegirlsStatus,
} from '../types'

const MEMBER_SELECT = `
  SELECT m.*,
         t.slug, t.business_name, t.trades, t.base_suburb, t.state,
         t.average_rating, t.total_reviews, t.completed_jobs, t.years_experience,
         t.logo_url, t.verification_status,
         u.name AS tradie_name
    FROM homegirls_members m
    JOIN tradespeople t ON t.id = m.tradesperson_id
    JOIN users u ON u.id = t.user_id
`

export async function listMembers(
  status: HomegirlsStatus | 'ALL' = 'APPROVED'
): Promise<HomegirlsMemberWithTradie[]> {
  const where = status === 'ALL' ? '' : `WHERE m.status = $1::homegirls_status`
  const params = status === 'ALL' ? [] : [status]
  return safeRead(
    () =>
      query<HomegirlsMemberWithTradie>(
        `${MEMBER_SELECT} ${where} ORDER BY t.average_rating DESC, t.completed_jobs DESC`,
        params
      ),
    []
  )
}

export async function getMemberByTradie(tradespersonId: string): Promise<HomegirlsMemberRow | null> {
  return safeRead(
    () =>
      queryOne<HomegirlsMemberRow>('SELECT * FROM homegirls_members WHERE tradesperson_id = $1', [
        tradespersonId,
      ]),
    null
  )
}

export async function applyForMembership(
  tradespersonId: string,
  intro: string,
  opts: { mentorAvailable?: boolean; seekingMentor?: boolean } = {}
): Promise<void> {
  await query(
    `INSERT INTO homegirls_members (tradesperson_id, intro, mentor_available, seeking_mentor, status)
     VALUES ($1,$2,$3,$4,'PENDING')
     ON CONFLICT (tradesperson_id) DO UPDATE
       SET intro = EXCLUDED.intro,
           mentor_available = EXCLUDED.mentor_available,
           seeking_mentor = EXCLUDED.seeking_mentor,
           status = CASE WHEN homegirls_members.status = 'DECLINED' THEN 'PENDING'::homegirls_status
                         ELSE homegirls_members.status END`,
    [tradespersonId, intro, opts.mentorAvailable ?? false, opts.seekingMentor ?? false]
  )
}

export async function setMemberStatus(
  memberId: string,
  status: HomegirlsStatus,
  approvedBy?: string
): Promise<void> {
  const row = await queryOne<HomegirlsMemberRow>(
    `UPDATE homegirls_members
        SET status = $2::homegirls_status,
            joined_at = CASE WHEN $2 = 'APPROVED' AND joined_at IS NULL THEN now() ELSE joined_at END,
            approved_by = COALESCE($3, approved_by)
      WHERE id = $1
      RETURNING *`,
    [memberId, status, approvedBy ?? null]
  )

  // Approved members show the Homegirls badge on their public listing.
  if (row) {
    await query('UPDATE tradespeople SET is_homegirl = $2 WHERE id = $1', [
      row.tradesperson_id,
      status === 'APPROVED',
    ])
  }
}

export async function listPosts(
  opts: { category?: string; includeHidden?: boolean; limit?: number } = {}
): Promise<HomegirlsPostWithAuthor[]> {
  const clauses: string[] = []
  const params: unknown[] = []
  const add = (v: unknown) => `$${params.push(v)}`

  if (!opts.includeHidden) clauses.push('p.is_hidden = FALSE')
  if (opts.category && opts.category !== 'all') clauses.push(`p.category = ${add(opts.category)}`)

  return safeRead(
    () =>
      query<HomegirlsPostWithAuthor>(
        `SELECT p.*,
                u.name           AS author_name,
                t.business_name  AS author_business,
                t.slug           AS author_slug
           FROM homegirls_posts p
           LEFT JOIN tradespeople t ON t.id = p.author_id
           LEFT JOIN users u ON u.id = t.user_id
          ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
          ORDER BY p.is_pinned DESC, p.created_at DESC
          LIMIT ${add(opts.limit ?? 50)}`,
        params
      ),
    []
  )
}

export async function createPost(input: {
  authorId: string | null
  title: string
  body: string
  category: string
}): Promise<HomegirlsPostRow | null> {
  return queryOne<HomegirlsPostRow>(
    `INSERT INTO homegirls_posts (author_id, title, body, category)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [input.authorId, input.title, input.body, input.category]
  )
}

export async function setPostHidden(id: string, hidden: boolean): Promise<void> {
  await query('UPDATE homegirls_posts SET is_hidden = $2 WHERE id = $1', [id, hidden])
}

export async function setPostPinned(id: string, pinned: boolean): Promise<void> {
  await query('UPDATE homegirls_posts SET is_pinned = $2 WHERE id = $1', [id, pinned])
}

export async function homegirlsStats(): Promise<{
  approved: number
  pending: number
  posts: number
  mentors: number
  jobsRequestingHomegirls: number
}> {
  const row = await safeRead(
    () =>
      queryOne<Record<string, number>>(
        `SELECT
           (SELECT count(*) FROM homegirls_members WHERE status = 'APPROVED')::int AS approved,
           (SELECT count(*) FROM homegirls_members WHERE status = 'PENDING')::int  AS pending,
           (SELECT count(*) FROM homegirls_posts WHERE is_hidden = FALSE)::int     AS posts,
           (SELECT count(*) FROM homegirls_members WHERE mentor_available)::int    AS mentors,
           (SELECT count(*) FROM jobs WHERE prefer_homegirl)::int                  AS jobs_requesting`
      ),
    null
  )
  return {
    approved: Number(row?.approved ?? 0),
    pending: Number(row?.pending ?? 0),
    posts: Number(row?.posts ?? 0),
    mentors: Number(row?.mentors ?? 0),
    jobsRequestingHomegirls: Number(row?.jobs_requesting ?? 0),
  }
}
