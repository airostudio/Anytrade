#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import pg from 'pg'
import { loadEnv, makePool } from './env.mjs'

/**
 * Applies db/schema.sql.
 *   npm run db:setup            → create anything missing (safe to re-run)
 *   npm run db:setup -- --reset → drop every AnyTrade table and type first
 */

loadEnv()

const reset = process.argv.includes('--reset')
const pool = makePool(pg)

const TABLES = [
  'audit_log',
  'contact_enquiries',
  'site_settings',
  'homegirls_posts',
  'homegirls_members',
  'notifications',
  'messages',
  'credit_ledger',
  'payments',
  'reviews',
  'bids',
  'jobs',
  'tradespeople',
  'users',
]

const TYPES = [
  'homegirls_status',
  'credit_reason',
  'verification_status',
  'review_status',
  'review_direction',
  'membership_tier',
  'payment_type',
  'payment_status',
  'bid_status',
  'job_urgency',
  'job_size',
  'job_status',
  'user_role',
]

async function main() {
  const client = await pool.connect()

  try {
    if (reset) {
      console.log('  Dropping existing AnyTrade tables…')
      // jobs ↔ bids reference each other, so drop the constraint first.
      await client.query('ALTER TABLE IF EXISTS jobs DROP CONSTRAINT IF EXISTS jobs_accepted_bid_fk')
      for (const table of TABLES) {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`)
      }
      for (const type of TYPES) {
        await client.query(`DROP TYPE IF EXISTS ${type} CASCADE`)
      }
      await client.query('DROP FUNCTION IF EXISTS set_updated_at() CASCADE')
    }

    const sql = readFileSync(resolve(process.cwd(), 'db/schema.sql'), 'utf8')
    console.log('  Applying db/schema.sql…')
    await client.query(sql)

    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`
    )
    console.log(`\n  Done. ${rows.length} tables in place:`)
    console.log(`  ${rows.map((r) => r.table_name).join(', ')}\n`)
    console.log('  Next: npm run db:seed\n')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error('\n  Schema setup failed:', error.message, '\n')
  process.exit(1)
})
