'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { lockGate, unlockGate, type GateName } from '@/lib/gates'
import { recordAudit } from '@/lib/repos/admin'
import type { ActionState } from './auth'

/** Shared handler for both passcode gates. */
async function attempt(gate: GateName, formData: FormData): Promise<ActionState> {
  const passcode = String(formData.get('passcode') ?? '')
  if (!passcode) return { error: 'Enter the passcode.' }

  const ok = await unlockGate(gate, passcode)
  if (!ok) {
    const session = await auth()
    await recordAudit({
      actorId: session?.user?.id ?? null,
      action: `${gate}.gate.failed`,
      entityType: 'gate',
      entityId: gate,
    })
    return { error: 'That passcode is not right.' }
  }

  const session = await auth()
  await recordAudit({
    actorId: session?.user?.id ?? null,
    action: `${gate}.gate.unlocked`,
    entityType: 'gate',
    entityId: gate,
  })
  return {}
}

export async function unlockAdminGate(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const result = await attempt('admin', formData)
  if (result.error) return result
  redirect(String(formData.get('next') || '/admin'))
}

export async function unlockHomegirlsGate(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const result = await attempt('homegirls', formData)
  if (result.error) return result
  redirect('/homegirls')
}

export async function lockAdminGate(): Promise<void> {
  lockGate('admin')
  redirect('/admin/unlock')
}

export async function lockHomegirlsGate(): Promise<void> {
  lockGate('homegirls')
  redirect('/homegirls/enter')
}
