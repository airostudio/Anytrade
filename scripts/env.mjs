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
