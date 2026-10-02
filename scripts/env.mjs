import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Minimal .env loader so the CLI scripts work without an extra dependency.
 * Real environment variables always win over the file.
 */
export function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), name)
    if (!existsSync(path)) continue

    for (const rawLine of readFileSync(path, 'utf8').split('\n')) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue

      const eq = line.indexOf('=')
      if (eq === -1) continue

      const key = line.slice(0, eq).trim()
      let value = line.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (!(key in process.env)) process.env[key] = value
    }
  }

  if (!process.env.DATABASE_URL) {
    console.error('\n  DATABASE_URL is not set.')
    console.error('  Copy .env.example to .env and point it at your Postgres database.\n')
    process.exit(1)
  }
}

export function makePool(pg) {
  const connectionString = process.env.DATABASE_URL
  const isLocal = /@(localhost|127\.0\.0\.1)/.test(connectionString)
  const wantsSsl = !isLocal && !/sslmode=disable/.test(connectionString)

  return new pg.Pool({
    connectionString,
    ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
  })
}

/** Hosts that can only ever be a developer's own machine. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal'])

function describeTarget() {
  try {
    const url = new URL(process.env.DATABASE_URL)
    return { host: url.hostname, user: decodeURIComponent(url.username) }
  } catch {
    return { host: '(unparseable)', user: '' }
  }
}

/**
 * Refuse to run a destructive script against anything but a local database.
 *
 * Seeding wipes every data table and plants accounts with known passwords;
 * `db:setup --reset` drops the schema outright. Either one pointed at a
 * production DATABASE_URL by habit, a stale shell variable or a pasted .env
 * would be a disaster, and the seeded accounts would also be a backdoor.
 *
 * The one deliberate way past this is setting ALLOW_DESTRUCTIVE_DB to the exact
 * `user@host` being targeted. That cannot be done by accident, and for Supabase
 * the username carries the project ref, so the value is unique to that project.
 */
export function assertSafeToWipe(action) {
  const { host, user } = describeTarget()
  if (LOCAL_HOSTS.has(host.toLowerCase())) return

  const target = `${user}@${host}`
  if (process.env.ALLOW_DESTRUCTIVE_DB === target) {
    console.warn(`\n  ⚠  ${action} against a NON-LOCAL database, explicitly allowed for ${target}\n`)
    return
  }

  console.error(`
  Refusing to ${action}.

  The database is not local:  ${target}

  This would wipe the data in that database${action.includes('reset') ? ' and drop its tables' : ''}.
  Nothing has been changed.

  If you really do mean this (a throwaway staging database, say), say so by
  setting the exact target:

      ALLOW_DESTRUCTIVE_DB="${target}"

  Never do that against production. For a production database use the
  non-destructive "npm run db:setup", which only adds what is missing.
`)
  process.exit(1)
}
