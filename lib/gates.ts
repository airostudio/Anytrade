import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { getSetting, SETTING_DEFAULTS } from './repos/settings'

/**
 * Shared-passcode gates.
 *
 * Two areas of the site sit behind a passcode on top of normal sign-in:
 *   • /admin      — ADMIN role (middleware) *and* the admin passcode
 *   • /homegirls  — the Homegirls network passcode
 *
 * The cookie stores an HMAC of the current passcode rather than the passcode
 * itself, so rotating the passcode in admin settings immediately invalidates
 * every cookie already issued.
 */

export type GateName = 'admin' | 'homegirls'

const COOKIE: Record<GateName, string> = {
  admin: 'at_gate_admin',
  homegirls: 'at_gate_homegirls',
}

const SETTING_KEY: Record<GateName, string> = {
  admin: 'gate.admin_passcode',
  homegirls: 'gate.homegirls_passcode',
}

const ENV_KEY: Record<GateName, string> = {
  admin: 'ADMIN_PASSCODE',
  homegirls: 'HOMEGIRLS_PASSCODE',
}

const MAX_AGE: Record<GateName, number> = {
  admin: 60 * 60 * 8, // a working day
  homegirls: 60 * 60 * 24 * 30,
}

function secret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'anytrade-dev-secret'
}

/**
 * The passcode in force: an environment variable wins (so production can keep
 * it out of the database), otherwise the value saved in admin settings.
 */
export async function currentPasscode(gate: GateName): Promise<string> {
  const fromEnv = process.env[ENV_KEY[gate]]
  if (fromEnv) return fromEnv
  const stored = await getSetting(SETTING_KEY[gate])
  return stored || SETTING_DEFAULTS[SETTING_KEY[gate]] || ''
}

function tokenFor(gate: GateName, passcode: string): string {
  return createHmac('sha256', secret()).update(`${gate}:${passcode}`).digest('hex')
}

function constantTimeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** True when the caller already holds a valid cookie for this gate. */
export async function isGateUnlocked(gate: GateName): Promise<boolean> {
  const cookie = cookies().get(COOKIE[gate])?.value
  if (!cookie) return false
  const expected = tokenFor(gate, await currentPasscode(gate))
  return constantTimeEquals(cookie, expected)
}

/** Check a submitted passcode and, if it matches, set the gate cookie. */
export async function unlockGate(gate: GateName, submitted: string): Promise<boolean> {
  const passcode = await currentPasscode(gate)
  if (!passcode || !constantTimeEquals(submitted.trim(), passcode)) return false

  cookies().set(COOKIE[gate], tokenFor(gate, passcode), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE[gate],
  })
  return true
}

export function lockGate(gate: GateName): void {
  cookies().delete(COOKIE[gate])
}
