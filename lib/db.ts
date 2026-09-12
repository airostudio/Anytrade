import { Pool, types, type PoolClient, type QueryResultRow } from 'pg'

/**
 * Postgres access layer.
 *
 * One pool per process, cached on globalThis so Next's dev-mode hot reload
 * doesn't open a new pool on every edit.
 */

// pg hands back NUMERIC and BIGINT as strings to avoid precision loss. Every
// numeric column here is money, a rating or a counter, all well inside the
// safe-integer range, so parse them into real numbers once and for all.
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v))) // numeric
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10))) // int8 / count

const globalForDb = globalThis as unknown as { anytradePool?: Pool }

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env and point it at your Postgres database.'
    )
  }

  // Hosted Postgres (Supabase, Neon, RDS) terminates TLS with a certificate
  // chain Node does not ship, so relax verification for those, but never for
  // a plain local database.
  const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString)
  const wantsSsl = !isLocal && !/sslmode=disable/.test(connectionString)

  return new Pool({
    connectionString,
    ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.PGPOOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  })
}

export function getPool(): Pool {
  if (!globalForDb.anytradePool) {
    globalForDb.anytradePool = createPool()
  }
  return globalForDb.anytradePool
}

/** Run a parameterised query and return all rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await getPool().query<T>(text, params as never[])
  return result.rows
}

/** Run a query expected to match at most one row. */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] ?? null
}

/** Run a `SELECT count(*)`-shaped query and return the number. */
export async function count(text: string, params: unknown[] = []): Promise<number> {
  const row = await queryOne<{ count: number }>(text, params)
  return Number(row?.count ?? 0)
}

/** Run several statements inside a single transaction. */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * True when a database is configured and reachable. Pages use this to show a
 * friendly "not connected yet" panel instead of a stack trace, which matters
 * on a fresh clone before `npm run db:setup` has been run.
 */
export async function isDatabaseReady(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false
  try {
    await query('SELECT 1')
    return true
  } catch {
    return false
  }
}

/** Wraps a read so a missing/unreachable database degrades to a fallback value. */
export async function safeRead<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback
  try {
    return await fn()
  } catch (error) {
    console.error('[db] read failed:', error instanceof Error ? error.message : error)
    return fallback
  }
}
