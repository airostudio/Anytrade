import { NextResponse } from 'next/server'
import { describeConnection, describeDbError, query } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Setup diagnostic: GET /api/health/db
 *
 * Says exactly what is wrong with the database connection — is the URL set, can
 * we reach the host, is the schema applied — without ever echoing credentials.
 * Safe to delete once the deployment is up and running.
 */

const EXPECTED_TABLES = [
  'audit_log',
  'bids',
  'contact_enquiries',
  'credit_ledger',
  'homegirls_members',
  'homegirls_posts',
  'jobs',
  'messages',
  'notifications',
  'payments',
  'reviews',
  'site_settings',
  'tradespeople',
  'users',
]

export async function GET() {
  const connection = describeConnection()

  if (!connection) {
    return NextResponse.json(
      {
        ok: false,
        stage: 'config',
        problem: 'DATABASE_URL is not set on this deployment.',
        fix: 'Add it in Vercel → Settings → Environment Variables, then REDEPLOY. Vercel only picks up environment variables on a new deployment.',
      },
      { status: 503 }
    )
  }

  // Supabase's direct host is IPv6-only and unreachable from Vercel's
  // functions. Flag it before even trying, because the resulting error is
  // opaque.
  const isSupabaseDirect = /^db\.[a-z0-9]+\.supabase\.co$/.test(connection.host)

  let rows: { table_name: string }[]
  try {
    rows = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`
    )
  } catch (error) {
    const failure = describeDbError(error)
    return NextResponse.json(
      {
        ok: false,
        stage: 'connection',
        connection,
        problem: failure.message,
        code: failure.code,
        fix:
          failure.hint ??
          (isSupabaseDirect
            ? 'This is the Supabase direct host, which is IPv6-only. Vercel cannot reach it. Switch DATABASE_URL to the Supavisor pooler: postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres'
            : 'Check DATABASE_URL, then redeploy.'),
        ...(isSupabaseDirect
          ? { warning: 'Supabase direct connection detected — use the pooler host on Vercel.' }
          : {}),
      },
      { status: 503 }
    )
  }

  const present = rows.map((r) => r.table_name)
  const missing = EXPECTED_TABLES.filter((t) => !present.includes(t))

  if (missing.length) {
    return NextResponse.json(
      {
        ok: false,
        stage: 'schema',
        connection,
        problem: `Connected, but ${missing.length} of ${EXPECTED_TABLES.length} tables are missing.`,
        missing,
        fix: 'Apply db/schema.sql: run `npm run db:setup`, or paste the file into your provider’s SQL editor.',
      },
      { status: 503 }
    )
  }

  return NextResponse.json({
    ok: true,
    stage: 'ready',
    connection,
    tables: present.length,
    ...(isSupabaseDirect
      ? {
          warning:
            'Connected via the Supabase direct host. That works locally but is IPv6-only and will fail on Vercel — switch to the pooler before deploying.',
        }
      : {}),
  })
}
