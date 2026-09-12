import type { JobSize, JobStatus, JobUrgency, BidStatus, PaymentStatus, MembershipTier } from './types'

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
})

const AUD_CENTS = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  minimumFractionDigits: 2,
})

export function money(value: number | null | undefined, withCents = false): string {
  if (value === null || value === undefined) return '—'
  return withCents ? AUD_CENTS.format(value) : AUD.format(value)
}

export function budgetRange(min: number | null, max: number | null): string {
  if (min && max) return min === max ? money(min) : `${money(min)} – ${money(max)}`
  if (max) return `Up to ${money(max)}`
  if (min) return `From ${money(min)}`
  return 'Open to quotes'
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return d.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeAgo(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`
  return `${Math.floor(days / 365)} year${days < 730 ? '' : 's'} ago`
}

export const JOB_SIZE_LABEL: Record<JobSize, string> = {
  ODD_JOB: 'Odd job',
  HALF_DAY: 'Half day',
  FULL_DAY: 'Full day',
  MULTI_DAY: 'A few days',
  LARGE_PROJECT: 'Big project',
}

export const JOB_URGENCY_LABEL: Record<JobUrgency, string> = {
  EMERGENCY: 'Emergency',
  THIS_WEEK: 'This week',
  NEXT_FORTNIGHT: 'Next fortnight',
  FLEXIBLE: 'No rush',
}

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  DRAFT: 'Draft',
  OPEN: 'Open for quotes',
  SHORTLISTING: 'Shortlisting',
  AWARDED: 'Awarded',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
}

export const BID_STATUS_LABEL: Record<BidStatus, string> = {
  PENDING: 'Submitted',
  SHORTLISTED: 'Shortlisted',
  ACCEPTED: 'Won',
  DECLINED: 'Not this time',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  HELD_IN_ESCROW: 'Held in escrow',
  RELEASED: 'Released',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

export const MEMBERSHIP_LABEL: Record<MembershipTier, string> = {
  FREE: 'Casual',
  SUBBIE: 'Subbie',
  GUVNOR: 'Guvnor',
  MASTER: 'Master',
}

/** Tailwind classes for a status pill, keyed by status. */
export function jobStatusTone(status: JobStatus): string {
  switch (status) {
    case 'OPEN':
      return 'bg-bottle text-canvas border-ink'
    case 'SHORTLISTING':
      return 'bg-mustard text-ink border-ink'
    case 'AWARDED':
    case 'IN_PROGRESS':
      return 'bg-safety text-ink border-ink'
    case 'COMPLETED':
      return 'bg-navy text-canvas border-ink'
    case 'CANCELLED':
    case 'EXPIRED':
      return 'bg-oxide text-canvas border-ink'
    default:
      return 'bg-canvas-dark text-ink border-ink'
  }
}

export function bidStatusTone(status: BidStatus): string {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-bottle text-canvas border-ink'
    case 'SHORTLISTED':
      return 'bg-mustard text-ink border-ink'
    case 'PENDING':
      return 'bg-canvas-dark text-ink border-ink'
    default:
      return 'bg-oxide text-canvas border-ink'
  }
}

export function paymentStatusTone(status: PaymentStatus): string {
  switch (status) {
    case 'RELEASED':
      return 'bg-bottle text-canvas border-ink'
    case 'HELD_IN_ESCROW':
      return 'bg-mustard text-ink border-ink'
    case 'PENDING':
    case 'PROCESSING':
      return 'bg-canvas-dark text-ink border-ink'
    default:
      return 'bg-oxide text-canvas border-ink'
  }
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Human-friendly job reference, e.g. AT-4K29T. */
export function jobReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 5; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `AT-${out}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text
  return `${text.slice(0, max).trimEnd()}…`
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`
}

/** Round to one decimal for display, dropping a trailing .0 */
export function rating1dp(value: number | null | undefined): string {
  if (!value) return '—'
  return (Math.round(value * 10) / 10).toFixed(1)
}
