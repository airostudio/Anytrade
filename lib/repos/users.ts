import bcrypt from 'bcryptjs'
import { query, queryOne, count, safeRead, transaction } from '../db'
import type { PublicUser, UserRole, UserRow } from '../types'
import { slugify } from '../utils'

const PUBLIC_COLUMNS = `id, email, name, role, phone, avatar_url, suburb, city, state, postcode,
  is_suspended, suspended_at, suspended_reason, last_login_at, client_rating, client_review_count,
  stripe_customer_id, created_at, updated_at`

export async function getUser(id: string): Promise<PublicUser | null> {
  return safeRead(
    () => queryOne<PublicUser>(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]),
    null
  )
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  return safeRead(
    () => queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]),
    null
  )
}

export async function emailTaken(email: string): Promise<boolean> {
  const row = await queryOne<{ id: string }>('SELECT id FROM users WHERE email = $1', [
    email.toLowerCase(),
  ])
  return Boolean(row)
}

export interface NewClient {
  name: string
  email: string
  password: string
  phone?: string
  suburb?: string
  city?: string
  state?: string
  postcode?: string
}

export async function createClient(input: NewClient): Promise<PublicUser> {
  const hash = await bcrypt.hash(input.password, 12)
  const row = await queryOne<PublicUser>(
    `INSERT INTO users (email, password, name, role, phone, suburb, city, state, postcode)
     VALUES ($1,$2,$3,'CLIENT',$4,$5,$6,$7,$8)
     RETURNING ${PUBLIC_COLUMNS}`,
    [
      input.email.toLowerCase(),
      hash,
      input.name,
      input.phone ?? null,
      input.suburb ?? null,
      input.city ?? null,
      input.state ?? null,
      input.postcode ?? null,
    ]
  )
  if (!row) throw new Error('Could not create that account.')
  return row
}

export interface NewTradie extends NewClient {
  businessName: string
  trades: string[]
  handymanServices?: string[]
  serviceAreas?: string[]
  yearsExperience?: number | null
  abn?: string
  licenceNumber?: string
  hourlyRate?: number | null
  calloutFee?: number | null
  tagline?: string
  bio?: string
  isHomegirl?: boolean
  /** Credits handed out on sign-up so a new tradie can quote straight away. */
  signupCredits?: number
}

export async function createTradie(
  input: NewTradie
): Promise<{ user: PublicUser; tradespersonId: string; slug: string }> {
  const hash = await bcrypt.hash(input.password, 12)
  const slug = await uniqueSlug(input.businessName || input.name)
  const credits = input.signupCredits ?? 5

  return transaction(async (client) => {
    const userRes = await client.query<PublicUser>(
      `INSERT INTO users (email, password, name, role, phone, suburb, city, state, postcode)
       VALUES ($1,$2,$3,'TRADESPERSON',$4,$5,$6,$7,$8)
       RETURNING ${PUBLIC_COLUMNS}`,
      [
        input.email.toLowerCase(),
        hash,
        input.name,
        input.phone ?? null,
        input.suburb ?? null,
        input.city ?? null,
        input.state ?? null,
        input.postcode ?? null,
      ]
    )
    const user = userRes.rows[0]

    const tradieRes = await client.query<{ id: string }>(
      `INSERT INTO tradespeople (user_id, slug, business_name, tagline, bio, trades,
                                 handyman_services, service_areas, base_suburb, city, state, postcode,
                                 years_experience, abn, licence_number, hourly_rate, callout_fee,
                                 is_homegirl, lead_credits, verification_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,'PENDING')
       RETURNING id`,
      [
        user.id,
        slug,
        input.businessName,
        input.tagline ?? null,
        input.bio ?? null,
        input.trades,
        input.handymanServices ?? [],
        input.serviceAreas ?? (input.suburb ? [input.suburb] : []),
        input.suburb ?? null,
        input.city ?? null,
        input.state ?? null,
        input.postcode ?? null,
        input.yearsExperience ?? null,
        input.abn ?? null,
        input.licenceNumber ?? null,
        input.hourlyRate ?? null,
        input.calloutFee ?? null,
        input.isHomegirl ?? false,
        credits,
      ]
    )
    const tradespersonId = tradieRes.rows[0].id

    if (credits > 0) {
      await client.query(
        `INSERT INTO credit_ledger (tradesperson_id, delta, balance_after, reason, note)
         VALUES ($1, $2, $2, 'SIGNUP_BONUS', 'Welcome credits')`,
        [tradespersonId, credits]
      )
    }

    return { user, tradespersonId, slug }
  })
}

async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || 'tradie'
  let candidate = root
  for (let i = 2; i < 50; i++) {
    const taken = await queryOne<{ id: string }>('SELECT id FROM tradespeople WHERE slug = $1', [
      candidate,
    ])
    if (!taken) return candidate
    candidate = `${root}-${i}`
  }
  return `${root}-${Date.now().toString(36)}`
}

export async function listUsers(
  opts: { role?: UserRole; q?: string; limit?: number } = {}
): Promise<PublicUser[]> {
  const clauses: string[] = []
  const params: unknown[] = []
  const add = (v: unknown) => `$${params.push(v)}`

  if (opts.role) clauses.push(`role = ${add(opts.role)}::user_role`)
  if (opts.q) {
    const p = add(`%${opts.q}%`)
    clauses.push(`(name ILIKE ${p} OR email ILIKE ${p})`)
  }

  return safeRead(
    () =>
      query<PublicUser>(
        `SELECT ${PUBLIC_COLUMNS} FROM users
          ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
          ORDER BY created_at DESC LIMIT ${add(opts.limit ?? 100)}`,
        params
      ),
    []
  )
}

export async function countUsers(role?: UserRole): Promise<number> {
  return safeRead(
    () =>
      role
        ? count('SELECT count(*) FROM users WHERE role = $1::user_role', [role])
        : count('SELECT count(*) FROM users'),
    0
  )
}

export async function setSuspended(
  userId: string,
  suspended: boolean,
  reason?: string
): Promise<void> {
  await query(
    `UPDATE users
        SET is_suspended = $2,
            suspended_at = CASE WHEN $2 THEN now() ELSE NULL END,
            suspended_reason = CASE WHEN $2 THEN $3 ELSE NULL END
      WHERE id = $1`,
    [userId, suspended, reason ?? null]
  )
}

export async function updateProfile(
  userId: string,
  patch: { name?: string; phone?: string | null; suburb?: string | null; city?: string | null; state?: string | null; postcode?: string | null }
): Promise<void> {
  const entries = Object.entries(patch).filter(([, v]) => v !== undefined)
  if (!entries.length) return
  const sets = entries.map(([key], i) => `${key} = $${i + 2}`)
  await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $1`, [
    userId,
    ...entries.map(([, v]) => v),
  ])
}

export async function changePassword(userId: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12)
  await query('UPDATE users SET password = $2 WHERE id = $1', [userId, hash])
}

export async function setStripeCustomerId(userId: string, customerId: string): Promise<void> {
  await query('UPDATE users SET stripe_customer_id = $2 WHERE id = $1', [userId, customerId])
}
