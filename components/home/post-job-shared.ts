import { JOB_SIZES, JOB_URGENCIES, POPULAR_SUBURBS, TRADE_CATEGORIES } from '@/lib/constants'
import { ODD_JOBS } from '@/lib/price-guide'
import { stateFromPostcode } from '@/lib/trust'

/** Everything the homepage collects before handing off to /post-a-job. */
export interface JobDraft {
  /** TRADE_CATEGORIES slug, or '' while undecided. */
  category: string
  description: string
  suburb: string
  state: string
  postcode: string
  size: string
  urgency: string
  preferHomegirl: boolean
}

export const EMPTY_DRAFT: JobDraft = {
  category: '',
  description: '',
  suburb: '',
  state: '',
  postcode: '',
  size: 'ODD_JOB',
  urgency: 'THIS_WEEK',
  preferHomegirl: false,
}

export const MIN_DESCRIPTION = 20

export const DRAFT_SIZES = JOB_SIZES.filter((s) => s.value !== 'LARGE_PROJECT')
export { JOB_URGENCIES }

/** Dropdown values: "trade:<slug>" or "task:<odd-job id>". */
export function describeWhat(value: string): Partial<JobDraft> {
  if (value.startsWith('trade:')) return { category: value.slice(6) }
  if (value.startsWith('task:')) {
    const job = ODD_JOBS.find((j) => j.id === value.slice(5))
    if (job) return { category: 'handyman', description: `${job.label}. ${job.detail}.` }
  }
  return {}
}

export function whatValue(draft: Pick<JobDraft, 'category'>): string {
  return draft.category ? `trade:${draft.category}` : ''
}

/**
 * Reads whatever a person types into the suburb box: "Parramatta", "2150",
 * "Parramatta NSW 2150" or an option picked from the suggestions.
 */
export function parseLocation(input: string): Pick<JobDraft, 'suburb' | 'state' | 'postcode'> {
  const text = input.trim()
  const postcode = text.match(/\b\d{4}\b/)?.[0] ?? ''
  const words = text
    .replace(/\b\d{4}\b/, '')
    .replace(/\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/i, '')
    .replace(/[,]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const known = POPULAR_SUBURBS.find(
    (s) =>
      (words && s.suburb.toLowerCase() === words.toLowerCase()) ||
      (postcode && s.postcode === postcode && !words)
  )
  if (known) return { suburb: known.suburb, state: known.state, postcode: known.postcode }

  return { suburb: words, state: postcode ? (stateFromPostcode(postcode) ?? '') : '', postcode }
}

export function locationLabel(d: Pick<JobDraft, 'suburb' | 'state' | 'postcode'>): string {
  return [d.suburb, d.state, d.postcode].filter(Boolean).join(' ')
}

export function tradeName(slug: string): string {
  return TRADE_CATEGORIES.find((c) => c.slug === slug)?.name ?? ''
}

function titleFrom(description: string): string {
  const lines = description
    .split('\n')
    .map((l) => l.replace(/^[\s•·*-]+/, '').trim())
    .filter(Boolean)
  const first = (lines[0] ?? 'Odd jobs').replace(/\.+$/, '')
  const title = lines.length > 1 ? `${first} + ${lines.length - 1} more` : first
  return title.length > 110 ? `${title.slice(0, 107)}...` : title.length < 6 ? 'Odd jobs' : title
}

/** The /post-a-job URL that carries the draft into the real form. */
export function postJobUrl(d: JobDraft): string {
  const p = new URLSearchParams()
  if (d.category) p.set('category', d.category)
  if (d.size) p.set('size', d.size)
  if (d.urgency) p.set('urgency', d.urgency)
  if (d.suburb) p.set('suburb', d.suburb)
  if (d.state) p.set('state', d.state)
  if (d.postcode) p.set('postcode', d.postcode)
  if (d.description) {
    p.set('description', d.description)
    p.set('title', titleFrom(d.description))
  }
  if (d.preferHomegirl) p.set('homegirl', '1')
  return `/post-a-job?${p.toString()}`
}
