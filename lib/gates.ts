import 'server-only'
import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { getSetting } from './repos/settings'

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

/**
 * The key gate cookies are signed with.
 *
 * Outside production a fixed development key is used so a fresh checkout works.
 * In production there is NO fallback: a signing key that is published in the
 * source would let anyone forge a valid cookie, so a missing secret leaves the
 * gates locked instead.
 */
function secret(): string {
  const configured = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET
  if (configured) return configured
  return process.env.NODE_ENV === 'production' ? '' : 'anytrade-development-only-key'
}

/**
 * The passcode in force: an environment variable wins (so production can keep
 * it out of the database), otherwise the value saved in admin settings.
 *
 * Returns an empty string when neither is set, and an empty passcode means the
 * gate is closed to everyone. There is intentionally no built-in default.
 */
export async function currentPasscode(gate: GateName): Promise<string> {
  const fromEnv = process.env[ENV_KEY[gate]]
  if (fromEnv) return fromEnv
  return (await getSetting(SETTING_KEY[gate])) || ''
}

/** True when this gate has a passcode and a signing key, i.e. can be opened at all. */
export async function isGateConfigured(gate: GateName): Promise<boolean> {
  return Boolean(secret()) && Boolean(await currentPasscode(gate))
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

  // Fail closed. With no passcode the "expected" cookie would be an HMAC of an
  // empty string, which is forgeable by anyone who knows the signing key.
  const passcode = await currentPasscode(gate)
  if (!passcode || !secret()) return false

  return constantTimeEquals(cookie, tokenFor(gate, passcode))
}

/** Check a submitted passcode and, if it matches, set the gate cookie. */
export async function unlockGate(gate: GateName, submitted: string): Promise<boolean> {
  const passcode = await currentPasscode(gate)
  if (!passcode || !secret()) return false
  if (!constantTimeEquals(submitted.trim(), passcode)) return false

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
