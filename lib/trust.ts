/**
 * Facts the homepage leans on for trust. Kept in one place so a claim is never
 * written twice and can be audited against what the platform really enforces.
 */

/** The 4-point check a tradie is put through before they are marked verified. */
export const VETTING_POINTS = [
  {
    key: 'licence',
    title: 'Licence checked',
    body: 'Trade licence numbers are matched against the state regulator before a tradie is marked verified.',
  },
  {
    key: 'abn',
    title: 'ABN active',
    body: 'We confirm an active Australian Business Number so you know exactly who you are dealing with.',
  },
  {
    key: 'insurance',
    title: 'Public liability insured',
    body: 'A current certificate of insurance on file, with the expiry date tracked.',
  },
  {
    key: 'history',
    title: 'Work history reviewed',
    body: 'Experience and references are looked over by a person, not a script, before the badge goes on.',
  },
] as const

/** Heritage: the year the business started trading. */
export const ESTABLISHED = 1968

export function yearsTrading(now: Date = new Date()): number {
  return now.getFullYear() - ESTABLISHED
}

/**
 * ATO ABN validation: subtract 1 from the first digit, weight the 11 digits,
 * and the sum must be divisible by 89. Used so the footer never prints an ABN
 * that fails the official checksum.
 */
export function isValidAbn(input: string): boolean {
  const digits = input.replace(/\s+/g, '')
  if (!/^\d{11}$/.test(digits)) return false
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  const nums = digits.split('').map(Number)
  nums[0] -= 1
  const sum = nums.reduce((acc, n, i) => acc + n * weights[i], 0)
  return sum % 89 === 0
}

export function formatAbn(input: string): string {
  const d = input.replace(/\s+/g, '')
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 11)}`
}

/** "1300 226 987" becomes "tel:1300226987". */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

/** Australian postcode to state, by the published Australia Post ranges. */
export function stateFromPostcode(postcode: string): string | null {
  if (!/^\d{4}$/.test(postcode)) return null
  const n = Number(postcode)
  if ((n >= 200 && n <= 299) || (n >= 2600 && n <= 2618) || (n >= 2900 && n <= 2920)) return 'ACT'
  if ((n >= 1000 && n <= 2599) || (n >= 2619 && n <= 2899) || (n >= 2921 && n <= 2999)) return 'NSW'
  if ((n >= 3000 && n <= 3999) || (n >= 8000 && n <= 8999)) return 'VIC'
  if ((n >= 4000 && n <= 4999) || (n >= 9000 && n <= 9999)) return 'QLD'
  if (n >= 5000 && n <= 5999) return 'SA'
  if (n >= 6000 && n <= 6999) return 'WA'
  if (n >= 7000 && n <= 7999) return 'TAS'
  if (n >= 800 && n <= 999) return 'NT'
  return null
}

/**
 * Only same-site relative paths may be used as a post-login destination, so a
 * crafted link can't bounce someone to another domain after they sign in.
 */
export function safeNext(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined
  if (/[\u0000-\u001f]/.test(value)) return undefined
  return value
}
