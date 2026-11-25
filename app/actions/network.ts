'use server'

import { z } from 'zod'
import { createEnquiry } from '@/lib/repos/admin'
import { TIMEFRAMES } from '@/lib/homegirls-network'
import type { ActionState } from './auth'

const postcode = z.string().regex(/^\d{4}$/, 'Enter a 4-digit Australian postcode.')
const phone = z
  .string()
  .trim()
  .max(20)
  .optional()
  .refine((v) => !v || /^[\d\s()+-]{8,20}$/.test(v), 'That phone number does not look right.')

const base = {
  name: z.string().trim().min(2, 'Tell us your name.').max(100),
  email: z.string().trim().email('That email address does not look right.'),
  phone,
  suburb: z.string().trim().min(2, 'Which suburb is this in?').max(80),
  postcode,
  /** Honeypot: real people never fill this in. */
  website: z.string().optional(),
}

const quoteSchema = z.object({
  ...base,
  memberId: z.string().max(80),
  memberName: z.string().max(120),
  memberTrade: z.string().max(80),
  isSample: z.enum(['true', 'false']),
  summary: z.string().trim().min(15, 'Describe the job in a sentence or two (at least 15 characters).').max(2000),
  timeframe: z.enum(TIMEFRAMES.map((t) => t.value) as [string, ...string[]]),
})

const mentorSchema = z.object({
  ...base,
  role: z.enum(['MENTOR', 'APPRENTICE']),
  trade: z.string().trim().min(2, 'Which trade are you in (or wanting to learn)?').max(80),
  message: z.string().trim().max(1500).optional(),
})

const firstIssue = (e: z.ZodError) => e.issues[0]?.message ?? 'Please check the form.'

/** A homeowner asks for a quote from a Homegirls Network member. */
export async function requestMemberQuote(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = quoteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: firstIssue(parsed.error) }
  const d = parsed.data
  if (d.website) return { success: 'sent' } // honeypot tripped: pretend, store nothing

  const timeframe = TIMEFRAMES.find((t) => t.value === d.timeframe)?.label ?? d.timeframe
  try {
    await createEnquiry({
      name: d.name,
      email: d.email,
      phone: d.phone || undefined,
      suburb: `${d.suburb} ${d.postcode}`,
      subject: 'Homegirls Network: quote request (female tradie requested)',
      message: [
        'FEMALE TRADIE REQUESTED: yes',
        `Requested member: ${d.memberName} (${d.memberTrade})${d.isSample === 'true' ? ' [sample profile, match with a real member]' : ''}`,
        `Preferred timeframe: ${timeframe}`,
        '',
        d.summary,
      ].join('\n'),
    })
  } catch (error) {
    console.error('[network] quote request failed', error)
    return { error: 'We could not send that just now. Please try again in a few minutes.' }
  }
  return { success: 'sent' }
}

/** A mentor or apprentice asks to join the mentorship program. */
export async function joinMentorship(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = mentorSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: firstIssue(parsed.error) }
  const d = parsed.data
  if (d.website) return { success: 'sent' }

  try {
    await createEnquiry({
      name: d.name,
      email: d.email,
      phone: d.phone || undefined,
      suburb: `${d.suburb} ${d.postcode}`,
      subject: `Homegirls Network: mentorship (${d.role === 'MENTOR' ? 'mentor' : 'apprentice'})`,
      message: [
        `Wants to join as: ${d.role === 'MENTOR' ? 'an experienced mentor' : 'an apprentice or emerging tradie'}`,
        `Trade: ${d.trade}`,
        '',
        d.message || '(no message)',
      ].join('\n'),
    })
  } catch (error) {
    console.error('[network] mentorship signup failed', error)
    return { error: 'We could not send that just now. Please try again in a few minutes.' }
  }
  return { success: 'sent' }
}
