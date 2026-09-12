'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { getTradieByUserId, updateTradie } from '@/lib/repos/tradies'
import { changePassword, updateProfile } from '@/lib/repos/users'
import type { ActionState } from './auth'

const tradieSchema = z.object({
  businessName: z.string().min(2, 'What name do you trade under?'),
  tagline: z.string().max(140).optional(),
  bio: z.string().max(3000).optional(),
  hourlyRate: z.coerce.number().min(0).max(1000).optional(),
  calloutFee: z.coerce.number().min(0).max(1000).optional(),
  minimumCharge: z.coerce.number().min(0).max(5000).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  baseSuburb: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().max(4).optional(),
  travelRadiusKm: z.coerce.number().int().min(1).max(300).optional(),
  abn: z.string().optional(),
  licenceNumber: z.string().optional(),
  insurerName: z.string().optional(),
})

export async function saveTradieProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user || session.user.role !== 'TRADESPERSON') {
    return { error: 'Sign in as a tradie.' }
  }

  const parsed = tradieSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }
  const data = parsed.data

  const tradie = await getTradieByUserId(session.user.id)
  if (!tradie) return { error: 'Tradie profile not found.' }

  const trades = formData.getAll('trades').map(String)
  if (!trades.length) return { error: 'Pick at least one trade.' }

  try {
    await updateTradie(tradie.id, {
      business_name: data.businessName,
      tagline: data.tagline || null,
      bio: data.bio || null,
      trades,
      handyman_services: formData.getAll('handymanServices').map(String),
      service_areas: String(formData.get('serviceAreas') ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      accepts_small_jobs: formData.get('acceptsSmallJobs') === 'on',
      available_now: formData.get('availableNow') === 'on',
      available_weekends: formData.get('availableWeekends') === 'on',
      emergency_callouts: formData.get('emergencyCallouts') === 'on',
      free_quotes: formData.get('freeQuotes') === 'on',
      hourly_rate: data.hourlyRate ?? null,
      callout_fee: data.calloutFee ?? null,
      minimum_charge: data.minimumCharge ?? null,
      years_experience: data.yearsExperience ?? null,
      base_suburb: data.baseSuburb || null,
      city: data.city || null,
      state: data.state || null,
      postcode: data.postcode || null,
      travel_radius_km: data.travelRadiusKm ?? 25,
      abn: data.abn || null,
      licence_number: data.licenceNumber || null,
      insurer_name: data.insurerName || null,
    })

    await updateProfile(session.user.id, {
      phone: String(formData.get('phone') ?? '') || null,
      suburb: data.baseSuburb || null,
      state: data.state || null,
      postcode: data.postcode || null,
    })
  } catch (error) {
    console.error('[profile] save failed', error)
    return { error: 'Could not save your profile. Please try again.' }
  }

  revalidatePath('/tradie/profile')
  revalidatePath(`/find-a-tradie/${tradie.slug}`)
  return { success: 'Profile saved. Your listing is updated.' }
}

export async function saveClientProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: 'Sign in first.' }

  const name = String(formData.get('name') ?? '').trim()
  if (name.length < 2) return { error: 'Tell us your name.' }

  try {
    await updateProfile(session.user.id, {
      name,
      phone: String(formData.get('phone') ?? '') || null,
      suburb: String(formData.get('suburb') ?? '') || null,
      state: String(formData.get('state') ?? '') || null,
      postcode: String(formData.get('postcode') ?? '') || null,
    })
  } catch (error) {
    console.error('[profile] client save failed', error)
    return { error: 'Could not save your details.' }
  }

  revalidatePath('/dashboard/account')
  return { success: 'Details saved.' }
}

export async function changeOwnPassword(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth()
  if (!session?.user) return { error: 'Sign in first.' }

  const next = String(formData.get('password') ?? '')
  const confirm = String(formData.get('confirm') ?? '')
  if (next.length < 8) return { error: 'Use at least 8 characters.' }
  if (next !== confirm) return { error: 'The two passwords do not match.' }

  await changePassword(session.user.id, next)
  return { success: 'Password changed.' }
}
