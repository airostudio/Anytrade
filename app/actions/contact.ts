'use server'

import { z } from 'zod'
import { createEnquiry } from '@/lib/repos/admin'
import type { ActionState } from './auth'

const schema = z.object({
  name: z.string().min(2, 'Your name, please.'),
  email: z.string().email('That email address does not look right.'),
  phone: z.string().optional(),
  subject: z.string().optional(),
  suburb: z.string().optional(),
  message: z.string().min(10, 'Tell us a bit more.').max(3000),
})

export async function sendEnquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = schema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form.' }

  try {
    await createEnquiry(parsed.data)
  } catch (error) {
    console.error('[contact] failed', error)
    return { error: 'Could not send that just now. Give the office a ring instead.' }
  }

  return { success: 'Thanks — we have your message and will come back to you within one business day.' }
}
