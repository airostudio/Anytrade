'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { applyForMembership, createPost } from '@/lib/repos/homegirls'
import { getTradieByUserId } from '@/lib/repos/tradies'
import { recordAudit } from '@/lib/repos/admin'
import type { ActionState } from './auth'

export async function applyToHomegirls(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: 'Sign in first.' }
  if (session.user.role !== 'TRADESPERSON') {
    return { error: 'Homegirls membership is for tradie accounts. Join as a tradie first.' }
  }

  const intro = String(formData.get('intro') ?? '').trim()
  if (intro.length < 30) {
    return { error: 'Tell the network a bit about yourself — at least 30 characters.' }
  }

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Tradie profile not found.' }

  await applyForMembership(tradie.id, intro, {
    mentorAvailable: formData.get('mentorAvailable') === 'on',
    seekingMentor: formData.get('seekingMentor') === 'on',
  })
  await recordAudit({
    actorId: session.user.id,
    action: 'homegirls.applied',
    entityType: 'tradesperson',
    entityId: tradie.id,
  })

  revalidatePath('/homegirls')
  return { success: 'Application received. An admin will review it shortly.' }
}

export async function postToNoticeboard(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: 'Sign in first.' }

  const title = String(formData.get('title') ?? '').trim()
  const body = String(formData.get('body') ?? '').trim()
  const category = String(formData.get('category') ?? 'noticeboard')

  if (title.length < 4) return { error: 'Give the post a title.' }
  if (body.length < 15) return { error: 'Write a bit more in the body.' }

  const tradie =
    session.user.role === 'TRADESPERSON' ? await getTradieByUserId(session.user.id) : null

  await createPost({ authorId: tradie?.id ?? null, title, body, category })
  revalidatePath('/homegirls')
  return { success: 'Posted to the noticeboard.' }
}
