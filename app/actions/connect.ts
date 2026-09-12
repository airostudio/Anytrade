'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { beginOnboarding, dashboardLink, syncConnectAccount } from '@/lib/connect'
import { recordAudit } from '@/lib/repos/admin'
import type { ActionState } from './auth'

/** Start or resume Stripe Connect onboarding for the signed-in tradie. */
export async function connectPayoutAccount(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') {
    return { error: 'Sign in as a tradie to set up payouts.' }
  }

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Tradie profile not found.' }

  let destination: string | null = null
  try {
    const result = await beginOnboarding(tradie)
    destination = result.url
    await recordAudit({
      actorId: session.user.id,
      action: result.demo ? 'connect.onboarding.demo' : 'connect.onboarding.started',
      entityType: 'tradesperson',
      entityId: tradie.id,
    })
  } catch (error) {
    console.error('[connect] onboarding failed', error)
    return { error: 'Could not open Stripe onboarding just now. Please try again.' }
  }

  revalidatePath('/tradie/billing')
  // Stripe hosts onboarding, so this leaves the app entirely.
  if (destination) redirect(destination)
  return { success: 'Payout account connected.' }
}

/** Re-read the connected account from Stripe — used by the "check again" button. */
export async function refreshPayoutStatus(
  _prev: ActionState,
  _formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') {
    return { error: 'Sign in as a tradie.' }
  }

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Tradie profile not found.' }
  if (!tradie.stripe_account_id) return { error: 'No payout account to check yet.' }

  const summary = await syncConnectAccount(tradie.id)
  revalidatePath('/tradie/billing')

  if (summary?.payoutsEnabled) return { success: 'Payout account is ready.' }
  return { success: 'Checked with Stripe — still waiting on a few details.' }
}

/** Single-use link into the tradie's own Stripe Express dashboard. */
export async function openPayoutDashboard(): Promise<void> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') return

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return

  const url = await dashboardLink(tradie)
  if (url) redirect(url)
  redirect('/tradie/billing?dashboard=unavailable')
}

/** Admin: force a re-sync of one tradie's connected account. */
export async function adminSyncPayoutAccount(formData: FormData): Promise<void> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return

  const tradespersonId = String(formData.get('tradespersonId'))
  await syncConnectAccount(tradespersonId)
  await recordAudit({
    actorId: session.user.id,
    action: 'admin.connect.synced',
    entityType: 'tradesperson',
    entityId: tradespersonId,
  })
  revalidatePath('/admin/tradies')
  revalidatePath('/admin/payments')
}
