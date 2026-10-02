'use server'

import { redirect } from 'next/navigation'
import { AuthError } from 'next-auth'
import { z } from 'zod'
import { homeForRole, signIn } from '@/lib/auth'
import { createClient, createTradie, emailTaken, getUserByEmail } from '@/lib/repos/users'
import { describeDbError, query } from '@/lib/db'
import { recordAudit } from '@/lib/repos/admin'

/**
 * Visitors get a plain message and never a database error code. The real cause
 * and the fix for it are written to the server log (Vercel → Logs), where only
 * the operator can see them.
 */
function logDbFailure(where: string, error: unknown): void {
  const failure = describeDbError(error)
  console.error(
    `[${where}] ${failure.message}${failure.code ? ` (${failure.code})` : ''}` +
      `${failure.hint ? ` — ${failure.hint}` : ''}`,
    error
  )
}

function signupFailureMessage(error: unknown, kind: 'client' | 'tradie'): string {
  logDbFailure(`signup:${kind}`, error)
  if (describeDbError(error).code === '23505') {
    return 'An account with that email already exists. Try signing in instead.'
  }
  return 'We could not create your account just now. Please try again in a few minutes.'
}

export interface ActionState {
  error?: string
  success?: string
}

const passwordRule = z.string().min(8, 'Password must be at least 8 characters.')

const clientSchema = z.object({
  name: z.string().min(2, 'Tell us your name.'),
  email: z.string().email('That email address does not look right.'),
  password: passwordRule,
  phone: z.string().optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
})

export async function signUpClient(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  }
  const data = parsed.data

  try {
    if (await emailTaken(data.email)) {
      return { error: 'An account with that email already exists. Try signing in instead.' }
    }

    const user = await createClient({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      suburb: data.suburb,
      state: data.state,
      postcode: data.postcode,
    })
    await recordAudit({ actorId: user.id, action: 'client.signup', entityType: 'user', entityId: user.id })
  } catch (error) {
    console.error('[signup] client failed', error)
    return { error: signupFailureMessage(error, 'client') }
  }

  await signIn('credentials', {
    email: data.email,
    password: data.password,
    redirectTo: '/dashboard',
  })
  return {}
}

const tradieSchema = clientSchema.extend({
  businessName: z.string().min(2, 'What name do you trade under?'),
  trades: z.array(z.string()).min(1, 'Pick at least one trade.'),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  abn: z.string().optional(),
  licenceNumber: z.string().optional(),
  hourlyRate: z.coerce.number().min(0).max(1000).optional(),
  tagline: z.string().max(140).optional(),
  bio: z.string().max(2000).optional(),
  isHomegirl: z.coerce.boolean().optional(),
})

export async function signUpTradie(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const raw = {
    ...Object.fromEntries(formData),
    trades: formData.getAll('trades').map(String),
    isHomegirl: formData.get('isHomegirl') === 'on',
  }

  const parsed = tradieSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  }
  const data = parsed.data

  try {
    if (await emailTaken(data.email)) {
      return { error: 'An account with that email already exists. Try signing in instead.' }
    }

    const created = await createTradie({
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      suburb: data.suburb,
      state: data.state,
      postcode: data.postcode,
      businessName: data.businessName,
      trades: data.trades,
      handymanServices: formData.getAll('handymanServices').map(String),
      serviceAreas: formData
        .getAll('serviceAreas')
        .map(String)
        .filter(Boolean),
      yearsExperience: data.yearsExperience ?? null,
      abn: data.abn,
      licenceNumber: data.licenceNumber,
      hourlyRate: data.hourlyRate ?? null,
      tagline: data.tagline,
      bio: data.bio,
      isHomegirl: data.isHomegirl,
    })
    await recordAudit({
      actorId: created.user.id,
      action: 'tradie.signup',
      entityType: 'tradesperson',
      entityId: created.tradespersonId,
      detail: data.businessName,
    })
  } catch (error) {
    console.error('[signup] tradie failed', error)
    return { error: signupFailureMessage(error, 'tradie') }
  }

  await signIn('credentials', {
    email: data.email,
    password: data.password,
    redirectTo: '/tradie',
  })
  return {}
}

export async function signInWithCredentials(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const callbackUrl = String(formData.get('callbackUrl') ?? '') || undefined

  if (!email || !password) return { error: 'Enter your email and password.' }

  // Land people on their own dashboard rather than the marketing homepage.
  // The role is read before signing in because signIn() redirects by throwing.
  let destination = callbackUrl
  if (!destination) {
    const account = await getUserByEmail(email)
    destination = homeForRole(account?.role)
  }

  try {
    await signIn('credentials', { email, password, redirectTo: destination })
  } catch (error) {
    if (error instanceof AuthError) {
      // A failed sign-in and an unreachable database look identical from here,
      // so probe before blaming the credentials. Costs nothing on success.
      try {
        await query('SELECT 1')
      } catch (dbError) {
        logDbFailure('sign-in', dbError)
        return { error: 'We cannot sign you in right now. Please try again in a few minutes.' }
      }
      return { error: 'Those details did not match an account.' }
    }
    // next-auth signals a successful redirect by throwing — let it through.
    throw error
  }
  return {}
}

export async function signOutAction(): Promise<void> {
  const { signOut } = await import('@/lib/auth')
  await signOut({ redirectTo: '/' })
  redirect('/')
}
