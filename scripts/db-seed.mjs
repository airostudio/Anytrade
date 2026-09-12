#!/usr/bin/env node
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { loadEnv, makePool } from './env.mjs'
import {
  ADMIN,
  CLIENTS,
  CLIENT_REVIEW_TEXT,
  DEMO_PASSWORD,
  ENQUIRIES,
  JOBS,
  NOTICEBOARD,
  SUBURBS,
  TRADIES,
  TRADIE_REVIEW_TEXT,
} from './seed-data.mjs'

/**
 * Fills an empty AnyTrade database with a coherent demo marketplace:
 * accounts, listings, jobs at every stage of the funnel, quotes, two-way
 * ratings, payments, credit movements, the Homegirls network and audit trail.
 *
 * Safe to re-run: it clears the data tables first (but not the schema).
 */

loadEnv()
const pool = makePool(pg)

// Deterministic PRNG so repeated seeds produce the same demo data.
let seed = 20260912
const rand = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296
  return seed / 4294967296
}
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (min, max) => min + rand() * (max - min)
const intBetween = (min, max) => Math.floor(between(min, max + 1))
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000)

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const usedReferences = new Set()
function reference() {
  for (;;) {
    let out = ''
    for (let i = 0; i < 5; i++) out += REFERENCE_ALPHABET[Math.floor(rand() * REFERENCE_ALPHABET.length)]
    const ref = `AT-${out}`
    if (!usedReferences.has(ref)) {
      usedReferences.add(ref)
      return ref
    }
  }
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function emailFor(name, domain) {
  const [first, ...rest] = name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
  return `${first}.${rest.join('') || 'au'}@${domain}`
}

function phone() {
  return `04${intBetween(10, 99)} ${intBetween(100, 999)} ${intBetween(100, 999)}`
}

function suburbFor(name) {
  return SUBURBS.find((s) => s.suburb === name) ?? SUBURBS[0]
}

const TAGS_TRADIE = [
  'Turned up on time',
  'Fair price',
  'Clean & tidy',
  'Great communication',
  'Knew their stuff',
  'Went the extra mile',
  'No surprises on the bill',
  'Explained the problem',
  'Would hire again',
]

const TAGS_CLIENT = [
  'Clear about the job',
  'Easy access on site',
  'Paid promptly',
  'Reasonable expectations',
  'Good communication',
  'Would work for again',
]

function someTags(pool_, count) {
  const copy = [...pool_]
  const out = []
  for (let i = 0; i < count && copy.length; i++) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  }
  return out
}

async function main() {
  const client = await pool.connect()
  const log = (msg) => console.log(`  ${msg}`)

  try {
    await client.query('BEGIN')

    log('Clearing existing data…')
    await client.query('UPDATE jobs SET accepted_bid_id = NULL')
    await client.query(`TRUNCATE
      audit_log, contact_enquiries, homegirls_posts, homegirls_members,
      notifications, messages, credit_ledger, payments, reviews, bids, jobs,
      tradespeople, users, site_settings RESTART IDENTITY CASCADE`)

    // ── Settings ────────────────────────────────────────────────────────────
    log('Writing site settings…')
    const SETTINGS = [
      ['site.tagline', 'Reliable tradies. Reasonable prices. No mucking about.', 'Tagline'],
      ['site.phone', '1300 226 987', 'Office phone'],
      ['site.email', 'office@anytrade.com.au', 'Office email'],
      ['site.abn', '61 428 903 114', 'Company ABN'],
      ['billing.platform_fee_rate', '0.075', 'Escrow platform fee'],
      ['billing.gst_rate', '0.10', 'GST rate'],
      ['bidding.max_bids_default', '6', 'Quotes accepted per job'],
      ['bidding.bid_window_days', '14', 'Days a job stays open'],
      ['reviews.auto_publish', 'true', 'Publish reviews immediately'],
      ['reviews.min_chars', '20', 'Minimum review comment length'],
      ['gate.admin_passcode', 'toolbox-1972', 'Admin section passcode'],
      ['gate.homegirls_passcode', 'homegirls-2024', 'Homegirls section passcode'],
      [
        'homegirls.intro',
        'A members-only network for the women working in Australian trades — and for clients who would rather book one.',
        'Homegirls intro',
      ],
    ]
    for (const [key, value, label] of SETTINGS) {
      await client.query(
        `INSERT INTO site_settings (key, value, label, "group") VALUES ($1,$2,$3,$4)`,
        [key, value, label, key.split('.')[0]]
      )
    }

    // ── Accounts ────────────────────────────────────────────────────────────
    log('Creating accounts…')
    const adminHash = await bcrypt.hash(ADMIN.password, 10)
    const demoHash = await bcrypt.hash(DEMO_PASSWORD, 10)

    const adminRes = await client.query(
      `INSERT INTO users (email, password, name, role, phone, suburb, city, state, postcode, last_login_at)
       VALUES ($1,$2,$3,'ADMIN',$4,'Parramatta','Sydney','NSW','2150', now()) RETURNING id`,
      [ADMIN.email, adminHash, ADMIN.name, phone()]
    )
    const adminId = adminRes.rows[0].id

    const clientIds = []
    for (const person of CLIENTS) {
      const place = suburbFor(person.suburb)
      const res = await client.query(
        `INSERT INTO users (email, password, name, role, phone, suburb, city, state, postcode, created_at, last_login_at)
         VALUES ($1,$2,$3,'CLIENT',$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          emailFor(person.name, 'example.com'),
          demoHash,
          person.name,
          phone(),
          place.suburb,
          place.city,
          place.state,
          place.postcode,
          daysAgo(intBetween(30, 420)),
          daysAgo(intBetween(0, 14)),
        ]
      )
      clientIds.push(res.rows[0].id)
    }

    const tradieRecords = []
    for (const tradie of TRADIES) {
      const place = suburbFor(tradie.suburb)
      const nearby = SUBURBS.filter((s) => s.state === place.state).slice(0, 6).map((s) => s.suburb)
      const areas = Array.from(new Set([place.suburb, ...nearby]))
      const createdAt = daysAgo(intBetween(120, 900))

      const userRes = await client.query(
        `INSERT INTO users (email, password, name, role, phone, suburb, city, state, postcode, created_at, last_login_at)
         VALUES ($1,$2,$3,'TRADESPERSON',$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [
          emailFor(tradie.name, `${slugify(tradie.business).slice(0, 22)}.com.au`),
          demoHash,
          tradie.name,
          phone(),
          place.suburb,
          place.city,
          place.state,
          place.postcode,
          createdAt,
          daysAgo(intBetween(0, 6)),
        ]
      )
      const userId = userRes.rows[0].id

      const verification = tradie.verified
        ? 'VERIFIED'
        : tradie.pendingVerification
          ? 'PENDING'
          : 'UNVERIFIED'

      // Stripe Connect: most established tradies are set up to be paid, a few
      // are part-way through, and the newest have not started. Demo account ids
      // are clearly fake so nobody mistakes them for live Stripe accounts.
      const connect = connectStateFor(tradie)

      const tradieRes = await client.query(
        `INSERT INTO tradespeople (
           user_id, slug, business_name, tagline, bio, trades, handyman_services,
           accepts_small_jobs, abn, licence_number, licence_expiry, insurer_name, insurance_expiry,
           years_experience, verification_status, verified_at, hourly_rate, callout_fee, minimum_charge,
           free_quotes, service_areas, base_suburb, city, state, postcode, travel_radius_km,
           available_now, available_weekends, emergency_callouts, is_homegirl,
           membership_tier, membership_started_at, membership_ends_at, lead_credits,
           stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled,
           stripe_details_submitted, stripe_requirements, stripe_onboarded, stripe_onboarded_at,
           average_rating, total_reviews, rating_quality, rating_punctuality, rating_value,
           rating_communication, rating_tidiness, completed_jobs, total_bids, won_bids,
           response_rate, response_time_mins, profile_views, is_featured, featured_until, created_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15::verification_status,$16,$17,$18,$19,
           $20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31::membership_tier,$32,$33,$34,
           $35,$36,$37,$38,$39,$40,$41,
           $42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56,$57
         ) RETURNING id`,
        [
          userId,
          slugify(tradie.business),
          tradie.business,
          tradie.tagline,
          tradie.bio,
          tradie.trades,
          tradie.handyman ?? [],
          (tradie.handyman ?? []).length > 0,
          tradie.abn,
          tradie.licence,
          tradie.licence ? daysAgo(-intBetween(90, 900)) : null,
          tradie.insurer,
          tradie.insurer ? daysAgo(-intBetween(60, 400)) : null,
          tradie.years,
          verification,
          tradie.verified ? daysAgo(intBetween(20, 300)) : null,
          tradie.hourly,
          tradie.callout,
          tradie.minimum,
          true,
          areas,
          place.suburb,
          place.city,
          place.state,
          place.postcode,
          intBetween(15, 60),
          true,
          Boolean(tradie.weekends),
          Boolean(tradie.emergency),
          Boolean(tradie.homegirl),
          tradie.tier,
          tradie.tier === 'FREE' ? null : daysAgo(intBetween(20, 300)),
          tradie.tier === 'FREE' ? null : daysAgo(-intBetween(3, 28)),
          tradie.credits,
          connect.accountId,
          connect.chargesEnabled,
          connect.payoutsEnabled,
          connect.detailsSubmitted,
          connect.requirements,
          connect.payoutsEnabled,
          connect.payoutsEnabled ? daysAgo(intBetween(10, 260)) : null,
          tradie.rating,
          tradie.reviews,
          Math.min(5, tradie.rating + between(-0.2, 0.15)).toFixed(2),
          Math.min(5, tradie.rating + between(-0.3, 0.1)).toFixed(2),
          Math.min(5, tradie.rating + between(-0.25, 0.1)).toFixed(2),
          Math.min(5, tradie.rating + between(-0.15, 0.15)).toFixed(2),
          Math.min(5, tradie.rating + between(-0.2, 0.2)).toFixed(2),
          tradie.jobs,
          Math.round(tradie.jobs * between(2.6, 4.2)),
          tradie.jobs,
          between(72, 99).toFixed(2),
          intBetween(12, 240),
          intBetween(80, 3200),
          Boolean(tradie.featured),
          tradie.featured ? daysAgo(-intBetween(5, 30)) : null,
          createdAt,
        ]
      )

      tradieRecords.push({
        ...tradie,
        id: tradieRes.rows[0].id,
        userId,
        place,
      })

      if (tradie.credits > 0) {
        await client.query(
          `INSERT INTO credit_ledger (tradesperson_id, delta, balance_after, reason, note, created_at)
           VALUES ($1, 5, 5, 'SIGNUP_BONUS', 'Welcome credits', $2)`,
          [tradieRes.rows[0].id, createdAt]
        )
      }
    }

    log(`  ${tradieRecords.length} tradies, ${clientIds.length} homeowners, 1 admin`)

    // ── Jobs, quotes, awards, ratings ───────────────────────────────────────
    log('Posting jobs and quotes…')

    let bidCount = 0
    let reviewCount = 0
    let paymentCount = 0

    for (const [index, spec] of JOBS.entries()) {
      // A job spec can pin its own suburb; otherwise it follows the customer's.
      const place = spec.suburb ? suburbFor(spec.suburb) : null
      const localClients = place
        ? CLIENTS.map((c, i) => ({ ...c, id: clientIds[i] })).filter((c) => c.suburb === place.suburb)
        : []
      const clientId = localClients.length
        ? localClients[index % localClients.length].id
        : clientIds[index % clientIds.length]
      const clientRow = await client.query('SELECT name, suburb, city, state, postcode FROM users WHERE id = $1', [
        clientId,
      ])
      const jobPlace = place ?? suburbFor(clientRow.rows[0].suburb)
      const postedAt = daysAgo(intBetween(1, 110))

      const jobRes = await client.query(
        `INSERT INTO jobs (
           reference, client_id, title, description, category, budget_min, budget_max,
           job_size, urgency, address, suburb, city, state, postcode, status,
           preferred_date, prefer_homegirl, max_bids, view_count, bids_close_at, created_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::job_size,$9::job_urgency,$10,$11,$12,$13,$14,
                   $15::job_status,$16,$17,6,$18,$19,$20)
         RETURNING id`,
        [
          reference(),
          clientId,
          spec.title,
          spec.description,
          spec.category,
          spec.min,
          spec.max,
          spec.size,
          spec.urgency,
          `${intBetween(1, 180)} ${pick(['Wattle', 'Kingsford', 'Beaconsfield', 'Rosebank', 'Glenelg', 'Cavendish', 'Tarrant'])} ${pick(['Street', 'Road', 'Avenue', 'Parade', 'Crescent'])}`,
          jobPlace.suburb,
          jobPlace.city,
          jobPlace.state,
          jobPlace.postcode,
          spec.status === 'CANCELLED' ? 'CANCELLED' : spec.status,
          rand() > 0.5 ? daysAgo(-intBetween(2, 21)) : null,
          Boolean(spec.homegirl),
          intBetween(8, 190),
          new Date(postedAt.getTime() + 14 * 86_400_000),
          postedAt,
        ]
      )
      const jobId = jobRes.rows[0].id

      // Who can plausibly quote on this job?
      let candidates = tradieRecords.filter((t) => t.trades.includes(spec.category))
      if (spec.homegirl) candidates = candidates.filter((t) => t.homegirl)
      if (!candidates.length) candidates = tradieRecords.filter((t) => t.trades.includes('handyman'))

      // Tradies quote on work near them, so prefer the same state. This also
      // leaves open leads sitting in other tradies' feeds, which is what the
      // demo needs to look alive.
      const local = candidates.filter((t) => t.place.state === jobPlace.state)
      if (local.length) candidates = local

      // A `reserved` job keeps a slot open for the demo tradie: one rival quote
      // so the comparison view has something to compare, and the demo tradie
      // themselves held back so the lead is still live in their feed.
      if (spec.reserved) candidates = candidates.filter((t) => t.id !== tradieRecords[0]?.id)

      const wanted = spec.reserved
        ? 1
        : spec.status === 'CANCELLED'
          ? intBetween(0, 1)
          : spec.status === 'OPEN'
            ? intBetween(1, 3) // leave slots free so the board still has room
            : intBetween(2, 5)
      const bidders = someTags(candidates, Math.min(wanted, candidates.length))

      const placedBids = []
      for (const [i, tradie] of bidders.entries()) {
        const mid = (spec.min + spec.max) / 2
        const amount = Math.round(between(spec.min * 0.95, spec.max * 0.98) / 5) * 5
        const bidAt = new Date(postedAt.getTime() + (i + 1) * intBetween(2, 20) * 3_600_000)
        const creditCost = { ODD_JOB: 1, HALF_DAY: 1, FULL_DAY: 2, MULTI_DAY: 3, LARGE_PROJECT: 5 }[spec.size] ?? 1

        const bidRes = await client.query(
          `INSERT INTO bids (
             job_id, tradesperson_id, user_id, amount, message, estimated_days, estimated_hours,
             includes_materials, includes_gst, available_from, warranty_months, status,
             is_shortlisted, seen_by_client, credits_spent, created_at
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'PENDING',$12,$13,$14,$15)
           RETURNING id`,
          [
            jobId,
            tradie.id,
            tradie.userId,
            amount,
            quoteMessage(tradie, spec, amount, mid),
            spec.size === 'ODD_JOB' || spec.size === 'HALF_DAY' ? null : intBetween(1, 6),
            spec.size === 'ODD_JOB' ? between(1, 4).toFixed(1) : spec.size === 'HALF_DAY' ? between(3, 5).toFixed(1) : null,
            rand() > 0.45,
            true,
            daysAgo(-intBetween(1, 18)),
            pick([null, 6, 12, 12, 24]),
            rand() > 0.6,
            rand() > 0.25,
            creditCost,
            bidAt,
          ]
        )
        placedBids.push({ id: bidRes.rows[0].id, tradie, amount, creditCost })
        bidCount++

        // Charge the credits so the ledger reconciles with the balance shown.
        await client.query(
          `INSERT INTO credit_ledger (tradesperson_id, delta, balance_after, reason, note, job_id, created_at)
           VALUES ($1, $2, $3, 'BID_UNLOCK', 'Quote submitted', $4, $5)`,
          [tradie.id, -creditCost, Math.max(0, tradie.credits - creditCost), jobId, bidAt]
        )
      }

      await client.query('UPDATE jobs SET bid_count = $2 WHERE id = $1', [jobId, placedBids.length])

      // Shortlist a couple on jobs still being decided.
      if (spec.status === 'OPEN' && !spec.reserved && placedBids.length > 2) {
        const shortlisted = placedBids[0]
        await client.query(
          `UPDATE bids SET status = 'SHORTLISTED', is_shortlisted = TRUE, shortlisted_at = now() WHERE id = $1`,
          [shortlisted.id]
        )
        await client.query(`UPDATE jobs SET status = 'SHORTLISTING' WHERE id = $1`, [jobId])
      }

      const needsWinner = ['AWARDED', 'IN_PROGRESS', 'COMPLETED'].includes(spec.status)
      if (!needsWinner || !placedBids.length) continue

      // Award the job to the best-value quote rather than always the cheapest.
      const winner = placedBids.reduce((best, bid) =>
        bid.tradie.rating / Math.sqrt(bid.amount) > best.tradie.rating / Math.sqrt(best.amount) ? bid : best
      )
      const awardedAt = new Date(postedAt.getTime() + intBetween(2, 6) * 86_400_000)

      await client.query(
        `UPDATE bids SET status = 'ACCEPTED', accepted_at = $2, is_shortlisted = TRUE, seen_by_client = TRUE WHERE id = $1`,
        [winner.id, awardedAt]
      )
      await client.query(
        `UPDATE bids SET status = 'DECLINED', declined_at = $2 WHERE job_id = $1 AND id <> $3`,
        [jobId, awardedAt, winner.id]
      )
      await client.query(
        `UPDATE jobs SET accepted_bid_id = $2, awarded_at = $3 WHERE id = $1`,
        [jobId, winner.id, awardedAt]
      )

      // Escrow payment for the awarded job.
      const fee = Math.round(winner.amount * 0.075 * 100) / 100
      const completed = spec.status === 'COMPLETED'
      const completedAt = completed
        ? new Date(awardedAt.getTime() + intBetween(1, 10) * 86_400_000)
        : null

      // The payout leg: paid out if the winner is Connect-ready, otherwise
      // parked as pending_account exactly as the live flow would leave it.
      const winnerConnect = connectStateFor(winner.tradie)
      const transferStatus = completed ? (winnerConnect.payoutsEnabled ? 'paid' : 'pending_account') : null

      await client.query(
        `INSERT INTO payments (
           job_id, user_id, type, description, amount, platform_fee, tradesperson_amount,
           status, held_at, released_at, stripe_checkout_session_id, created_at,
           transfer_group, destination_account_id, transfer_status, stripe_transfer_id, transferred_at
         ) VALUES ($1,$2,'JOB_DEPOSIT',$3,$4,$5,$6,$7::payment_status,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
        [
          jobId,
          clientId,
          spec.title,
          winner.amount,
          fee,
          Math.round((winner.amount - fee) * 100) / 100,
          completed ? 'RELEASED' : 'HELD_IN_ESCROW',
          awardedAt,
          completedAt,
          `cs_demo_${slugify(reference()).slice(0, 18)}`,
          awardedAt,
          `job_${jobId}`,
          winnerConnect.accountId,
          transferStatus,
          transferStatus === 'paid' ? `tr_demo_${jobId.replace(/-/g, '').slice(0, 16)}` : null,
          transferStatus === 'paid' ? completedAt : null,
        ]
      )
      paymentCount++

      if (spec.status === 'COMPLETED') {
        await client.query(
          `UPDATE jobs SET status = 'COMPLETED', completed_at = $2 WHERE id = $1`,
          [jobId, completedAt]
        )

        // Two-way ratings, the way the live flow produces them.
        const overall = Math.min(5, Math.max(3, Math.round(winner.tradie.rating + between(-0.6, 0.4))))
        await client.query(
          `INSERT INTO reviews (
             job_id, direction, reviewer_id, reviewee_id, tradesperson_id, rating, comment, tags,
             rating_quality, rating_punctuality, rating_value, rating_communication, rating_tidiness,
             status, response, responded_at, created_at
           ) VALUES ($1,'CLIENT_TO_TRADIE',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'PUBLISHED',$13,$14,$15)`,
          [
            jobId,
            clientId,
            winner.tradie.userId,
            winner.tradie.id,
            overall,
            pick(CLIENT_REVIEW_TEXT),
            someTags(TAGS_TRADIE, intBetween(2, 4)),
            Math.min(5, overall + (rand() > 0.7 ? 0 : 0)),
            Math.max(3, overall - (rand() > 0.8 ? 1 : 0)),
            Math.max(3, overall - (rand() > 0.75 ? 1 : 0)),
            overall,
            Math.min(5, overall),
            rand() > 0.6 ? 'Thanks very much for that — glad it all worked out. Give us a yell any time.' : null,
            rand() > 0.6 ? new Date(completedAt.getTime() + 86_400_000) : null,
            new Date(completedAt.getTime() + intBetween(1, 4) * 86_400_000),
          ]
        )
        reviewCount++

        // The tradie rates the customer back.
        if (rand() > 0.15) {
          await client.query(
            `INSERT INTO reviews (job_id, direction, reviewer_id, reviewee_id, rating, comment, tags, status, created_at)
             VALUES ($1,'TRADIE_TO_CLIENT',$2,$3,$4,$5,$6,'PUBLISHED',$7)`,
            [
              jobId,
              winner.tradie.userId,
              clientId,
              intBetween(4, 5),
              pick(TRADIE_REVIEW_TEXT),
              someTags(TAGS_CLIENT, intBetween(2, 3)),
              new Date(completedAt.getTime() + intBetween(1, 5) * 86_400_000),
            ]
          )
          reviewCount++
        }
      } else if (spec.status === 'IN_PROGRESS') {
        await client.query(`UPDATE jobs SET status = 'IN_PROGRESS' WHERE id = $1`, [jobId])
      }
    }

    log(`  ${JOBS.length} jobs, ${bidCount} quotes, ${reviewCount} ratings, ${paymentCount} escrow payments`)

    // Recompute the denormalised aggregates from the reviews we just wrote, so
    // the seeded averages are internally consistent.
    log('Recalculating ratings…')
    await client.query(`
      UPDATE tradespeople t
         SET average_rating       = COALESCE(r.avg_overall, t.average_rating),
             total_reviews        = t.total_reviews + COALESCE(r.n, 0),
             rating_quality       = COALESCE(r.avg_quality, t.rating_quality),
             rating_punctuality   = COALESCE(r.avg_punctuality, t.rating_punctuality),
             rating_value         = COALESCE(r.avg_value, t.rating_value),
             rating_communication = COALESCE(r.avg_communication, t.rating_communication),
             rating_tidiness      = COALESCE(r.avg_tidiness, t.rating_tidiness)
        FROM (
          SELECT tradesperson_id,
                 count(*) AS n,
                 avg(rating) AS avg_overall,
                 avg(rating_quality) AS avg_quality,
                 avg(rating_punctuality) AS avg_punctuality,
                 avg(rating_value) AS avg_value,
                 avg(rating_communication) AS avg_communication,
                 avg(rating_tidiness) AS avg_tidiness
            FROM reviews
           WHERE direction = 'CLIENT_TO_TRADIE' AND status = 'PUBLISHED'
           GROUP BY tradesperson_id
        ) r
       WHERE t.id = r.tradesperson_id`)

    await client.query(`
      UPDATE users u
         SET client_rating = COALESCE(r.avg_overall, 0),
             client_review_count = COALESCE(r.n, 0)
        FROM (
          SELECT reviewee_id, count(*) AS n, avg(rating) AS avg_overall
            FROM reviews
           WHERE direction = 'TRADIE_TO_CLIENT' AND status = 'PUBLISHED'
           GROUP BY reviewee_id
        ) r
       WHERE u.id = r.reviewee_id`)

    // ── Billing history ─────────────────────────────────────────────────────
    log('Adding credit and membership purchases…')
    const PACKS = [
      { id: 'starter', name: 'Smoko Pack', credits: 10, price: 39 },
      { id: 'standard', name: 'Toolbox Pack', credits: 30, price: 99 },
      { id: 'bulk', name: 'Ute Load', credits: 80, price: 229 },
    ]
    const TIER_PRICE = { SUBBIE: 49, GUVNOR: 119, MASTER: 249 }

    for (const tradie of tradieRecords) {
      const purchases = tradie.tier === 'FREE' ? intBetween(0, 2) : intBetween(1, 3)
      for (let i = 0; i < purchases; i++) {
        const pack = pick(PACKS)
        const at = daysAgo(intBetween(5, 200))
        await client.query(
          `INSERT INTO payments (user_id, type, description, amount, status, released_at, stripe_checkout_session_id, created_at)
           VALUES ($1,'LEAD_CREDITS',$2,$3,'RELEASED',$4,$5,$4)`,
          [
            tradie.userId,
            `${pack.name} — ${pack.credits} lead credits`,
            pack.price,
            at,
            `cs_demo_${slugify(reference()).slice(0, 18)}`,
          ]
        )
        await client.query(
          `INSERT INTO credit_ledger (tradesperson_id, delta, balance_after, reason, note, created_at)
           VALUES ($1,$2,$3,'PURCHASE',$4,$5)`,
          [tradie.id, pack.credits, tradie.credits, `${pack.name} purchase`, at]
        )
        paymentCount++
      }

      if (tradie.tier !== 'FREE') {
        // Three months of membership invoices.
        for (let month = 0; month < 3; month++) {
          const at = daysAgo(month * 30 + intBetween(1, 6))
          await client.query(
            `INSERT INTO payments (user_id, type, description, amount, status, released_at, stripe_invoice_id, created_at)
             VALUES ($1,'MEMBERSHIP',$2,$3,'RELEASED',$4,$5,$4)`,
            [
              tradie.userId,
              `${tradie.tier} membership — monthly`,
              TIER_PRICE[tradie.tier],
              at,
              `in_demo_${slugify(reference()).slice(0, 18)}`,
            ]
          )
          paymentCount++
        }
        await client.query(
          `INSERT INTO credit_ledger (tradesperson_id, delta, balance_after, reason, note, created_at)
           VALUES ($1,$2,$3,'MEMBERSHIP_ALLOWANCE',$4,$5)`,
          [
            tradie.id,
            { SUBBIE: 15, GUVNOR: 45, MASTER: 120 }[tradie.tier],
            tradie.credits,
            'Monthly allowance',
            daysAgo(intBetween(1, 25)),
          ]
        )
      }
    }

    // ── Homegirls ───────────────────────────────────────────────────────────
    log('Setting up the Homegirls network…')
    const homegirls = tradieRecords.filter((t) => t.homegirl)
    for (const [i, member] of homegirls.entries()) {
      // Leave a couple pending so the admin queue has something in it.
      const status = i >= homegirls.length - 2 ? 'PENDING' : 'APPROVED'
      await client.query(
        `INSERT INTO homegirls_members (tradesperson_id, status, joined_at, approved_by, intro, mentor_available, seeking_mentor, created_at)
         VALUES ($1,$2::homegirls_status,$3,$4,$5,$6,$7,$8)`,
        [
          member.id,
          status,
          status === 'APPROVED' ? daysAgo(intBetween(30, 400)) : null,
          status === 'APPROVED' ? adminId : null,
          member.intro ?? null,
          Boolean(member.mentor),
          Boolean(member.seeking),
          daysAgo(intBetween(30, 420)),
        ]
      )
      // Only approved members carry the public badge.
      if (status !== 'APPROVED') {
        await client.query('UPDATE tradespeople SET is_homegirl = FALSE WHERE id = $1', [member.id])
      }
    }

    const approvedHomegirls = homegirls.slice(0, Math.max(1, homegirls.length - 2))
    for (const [i, post] of NOTICEBOARD.entries()) {
      await client.query(
        `INSERT INTO homegirls_posts (author_id, title, body, category, is_pinned, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          post.pinned ? null : approvedHomegirls[i % approvedHomegirls.length]?.id ?? null,
          post.title,
          post.body,
          post.category,
          Boolean(post.pinned),
          daysAgo(intBetween(2, 120)),
        ]
      )
    }

    // ── Enquiries, notifications, audit ─────────────────────────────────────
    log('Adding enquiries, notifications and the audit trail…')
    for (const enquiry of ENQUIRIES) {
      const at = daysAgo(intBetween(1, 40))
      await client.query(
        `INSERT INTO contact_enquiries (name, email, phone, subject, message, suburb, is_handled, handled_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [
          enquiry.name,
          enquiry.email,
          enquiry.phone ?? null,
          enquiry.subject,
          enquiry.message,
          enquiry.suburb ?? null,
          Boolean(enquiry.handled),
          enquiry.handled ? new Date(at.getTime() + 86_400_000) : null,
          at,
        ]
      )
    }

    const notifications = [
      ['New quote received', 'You have a new quote to compare.', '/dashboard', 'bid'],
      ['Job signed off', 'Rate your tradie to finish up.', '/dashboard', 'review'],
      ['Payment held in escrow', 'Released when you sign the job off.', '/dashboard/payments', 'billing'],
    ]
    for (const id of clientIds.slice(0, 8)) {
      const [title, body, link, kind] = pick(notifications)
      await client.query(
        `INSERT INTO notifications (user_id, title, body, link, kind, is_read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, title, body, link, kind, rand() > 0.6, daysAgo(intBetween(0, 20))]
      )
    }
    for (const tradie of tradieRecords.slice(0, 12)) {
      await client.query(
        `INSERT INTO notifications (user_id, title, body, link, kind, is_read, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [
          tradie.userId,
          pick(['Your quote was opened', 'You have been shortlisted', 'Lead credits added', 'New job in your area']),
          null,
          '/tradie',
          'general',
          rand() > 0.5,
          daysAgo(intBetween(0, 14)),
        ]
      )
    }

    const auditActions = [
      ['admin.tradie.verification', 'tradesperson', 'VERIFIED — licence and insurance sighted'],
      ['admin.review.moderated', 'review', 'HIDDEN — personal details in the comment'],
      ['admin.settings.saved', 'site_settings', 'bidding.max_bids_default'],
      ['admin.homegirls.status', 'homegirls_member', 'APPROVED'],
      ['admin.user.suspended', 'user', 'Repeated no-shows'],
      ['admin.payment.status', 'payment', 'RELEASED'],
      ['admin.credits.adjusted', 'tradesperson', '+5 credits — goodwill after a cancelled job'],
      ['admin.gate.unlocked', 'gate', null],
    ]
    for (let i = 0; i < 26; i++) {
      const [action, entityType, detail] = pick(auditActions)
      await client.query(
        `INSERT INTO audit_log (actor_id, action, entity_type, detail, ip_address, created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [adminId, action, entityType, detail, `203.0.113.${intBetween(2, 250)}`, daysAgo(intBetween(0, 90))]
      )
    }

    await client.query('COMMIT')

    const counts = await client.query(`
      SELECT
        (SELECT count(*) FROM users)::int AS users,
        (SELECT count(*) FROM tradespeople)::int AS tradies,
        (SELECT count(*) FROM jobs)::int AS jobs,
        (SELECT count(*) FROM bids)::int AS bids,
        (SELECT count(*) FROM reviews)::int AS reviews,
        (SELECT count(*) FROM payments)::int AS payments,
        (SELECT count(*) FROM homegirls_members)::int AS homegirls`)
    const c = counts.rows[0]

    console.log('\n  ── Seeded ───────────────────────────────────────────')
    console.log(`  Users ${c.users} · Tradies ${c.tradies} · Jobs ${c.jobs}`)
    console.log(`  Quotes ${c.bids} · Ratings ${c.reviews} · Payments ${c.payments}`)
    console.log(`  Homegirls members ${c.homegirls}`)
    console.log('\n  ── Sign in ──────────────────────────────────────────')
    console.log(`  Admin       ${ADMIN.email} / ${ADMIN.password}`)
    console.log(`              admin passcode: toolbox-1972`)
    console.log(`  Homeowner   ${emailForDisplay(CLIENTS[0].name, 'example.com')} / ${DEMO_PASSWORD}`)
    console.log(`  Tradie      ${emailForDisplay(TRADIES[0].name, `${slugify(TRADIES[0].business).slice(0, 22)}.com.au`)} / ${DEMO_PASSWORD}`)
    console.log(`  Homegirls passcode: homegirls-2024\n`)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

/**
 * Which payout state a seeded tradie is in. Paid-tier, verified tradies are
 * onboarded; one is deliberately left half-finished so the "Stripe still needs"
 * panel has something to show.
 */
function connectStateFor(tradie) {
  const none = {
    accountId: null,
    chargesEnabled: false,
    payoutsEnabled: false,
    detailsSubmitted: false,
    requirements: [],
  }
  if (!tradie.verified) return none

  const id = `acct_demo_${slugify(tradie.business).replace(/-/g, '').slice(0, 14)}`

  if (tradie.tier === 'FREE') {
    // Started onboarding, never finished.
    return {
      accountId: id,
      chargesEnabled: false,
      payoutsEnabled: false,
      detailsSubmitted: false,
      requirements: ['external_account', 'individual.verification.document'],
    }
  }

  return {
    accountId: id,
    chargesEnabled: true,
    payoutsEnabled: true,
    detailsSubmitted: true,
    requirements: [],
  }
}

function emailForDisplay(name, domain) {
  const [first, ...rest] = name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
  return `${first}.${rest.join('') || 'au'}@${domain}`
}

/** Builds a quote message that reads like the tradie wrote it. */
function quoteMessage(tradie, spec, amount, mid) {
  const cheap = amount < mid
  const openers = [
    `G'day, ${tradie.name.split(' ')[0]} here from ${tradie.business}.`,
    `Thanks for posting this one.`,
    `Happy to take this on.`,
    `I've done a lot of these.`,
  ]
  const middles = [
    `I've read through what you've written and I reckon it's a ${spec.size === 'ODD_JOB' ? 'couple of hours' : spec.size === 'HALF_DAY' ? 'half day' : spec.size === 'FULL_DAY' ? 'full day' : 'multi-day'} job.`,
    `Been doing this trade ${tradie.years} years, mostly around ${tradie.suburb} and nearby.`,
    `I'll bring everything I need on the first visit so there's no second trip.`,
  ]
  const pricing = cheap
    ? `Price is on the sharp side because I'm already working in your area that week.`
    : `It's not the cheapest quote you'll get, but it includes proper prep and I stand behind the work.`
  const closers = [
    `Quote includes GST. Give us a yell if you want to talk it through first.`,
    `Happy to come and have a look before you decide — no charge for that.`,
    `I can usually work around your hours if you're at work during the day.`,
    `Any questions, just message me through the job.`,
  ]

  return `${pick(openers)} ${pick(middles)} ${pricing} ${pick(closers)}`
}

main().catch((error) => {
  console.error('\n  Seeding failed:', error.message, '\n')
  console.error(error)
  process.exit(1)
})
