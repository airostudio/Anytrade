import { query, safeRead } from '../db'
import { categoryName } from '../constants'
import type { NetworkMember } from '../homegirls-network'

interface Row {
  id: string
  name: string
  avatar_url: string | null
  trades: string[]
  tagline: string | null
  bio: string | null
  base_suburb: string | null
  state: string | null
  postcode: string | null
  service_areas: string[] | null
  years_experience: number | null
  licence_number: string | null
  insurer_name: string | null
  insurance_expiry: Date | null
  abn: string | null
  verification_status: string
  available_now: boolean
  available_weekends: boolean
  mentor_available: boolean
}

/**
 * Approved Homegirls Network members for the public directory.
 * Only public-facing fields are selected: never an email, phone or street address.
 */
export async function listPublicMembers(): Promise<NetworkMember[]> {
  const rows = await safeRead(
    () =>
      query<Row>(
        `SELECT t.id, u.name, u.avatar_url, t.trades, t.tagline, t.bio,
                t.base_suburb, t.state, t.postcode, t.service_areas,
                t.years_experience, t.licence_number, t.insurer_name,
                t.insurance_expiry, t.abn, t.verification_status,
                t.available_now, t.available_weekends, m.mentor_available
           FROM homegirls_members m
           JOIN tradespeople t ON t.id = m.tradesperson_id
           JOIN users u ON u.id = t.user_id
          WHERE m.status = 'APPROVED' AND u.is_suspended = FALSE
          ORDER BY (t.verification_status = 'VERIFIED') DESC,
                   t.average_rating DESC, t.completed_jobs DESC
          LIMIT 60`
      ),
    [] as Row[]
  )

  return rows.map((r) => {
    const verified = r.verification_status === 'VERIFIED'
    const insured =
      verified &&
      Boolean(r.insurer_name) &&
      (!r.insurance_expiry || new Date(r.insurance_expiry) > new Date())
    const primary = r.trades[0] ?? 'handyman'
    const quals: string[] = []
    if (verified && r.licence_number) quals.push('Trade licence checked by AnyTrade')
    if (insured) quals.push('Public liability insurance on file')
    if (verified && r.abn) quals.push('Active ABN confirmed')
    if (r.years_experience) quals.push(`${r.years_experience}+ years in the trade`)

    return {
      id: r.id,
      name: r.name,
      trade: primary,
      trades: r.trades,
      tradeLabel: categoryName(primary),
      suburb: r.base_suburb ?? '',
      state: r.state ?? '',
      postcode: r.postcode ?? '',
      serviceAreas: r.service_areas ?? [],
      tagline: r.tagline ?? '',
      bio: r.bio ?? r.tagline ?? '',
      years: r.years_experience,
      available: r.available_now,
      availabilityNote: r.available_now
        ? r.available_weekends
          ? 'Taking new jobs, including weekends.'
          : 'Taking new jobs on weekdays.'
        : 'Not taking new jobs right now.',
      qualifications: quals,
      licence: verified && Boolean(r.licence_number),
      insured,
      abn: verified && Boolean(r.abn),
      mentor: r.mentor_available,
      photoUrl: r.avatar_url,
      sample: false,
    }
  })
}
