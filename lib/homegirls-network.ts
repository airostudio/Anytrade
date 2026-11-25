/**
 * Data model and pure helpers for the public Homegirls Network page.
 * Real members come from lib/repos/network.ts; the SAMPLE list below only tops
 * the directory up (and is always labelled) until enough real members exist.
 */

export interface NetworkMember {
  id: string
  name: string
  /** Primary trade, as a TRADE_CATEGORIES slug. */
  trade: string
  /** Every trade slug the member works in (used by the trade filter). */
  trades: string[]
  tradeLabel: string
  suburb: string
  state: string
  postcode: string
  /** Extra suburbs the member travels to. */
  serviceAreas: string[]
  tagline: string
  bio: string
  years: number | null
  available: boolean
  availabilityNote: string
  qualifications: string[]
  licence: boolean
  insured: boolean
  abn: boolean
  mentor: boolean
  /** Consented portrait; when null a botanical placeholder is drawn instead. */
  photoUrl: string | null
  sample: boolean
}

/** The trade filter options, in the order they appear. Slugs match TRADE_CATEGORIES. */
export const TRADE_FILTERS = [
  { value: 'all', label: 'All Trades' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'carpentry', label: 'Carpentry & Joinery' },
  { value: 'tiling', label: 'Tiling' },
  { value: 'painting', label: 'Painting' },
  { value: 'handyman', label: 'Handyman & Odd Jobs' },
] as const

/** Suggestions for the suburb filter. Anything typed is matched too. */
export const SUBURB_SUGGESTIONS = [
  'Brunswick, VIC 3056',
  'Fitzroy, VIC 3065',
  'Yarraville, VIC 3013',
] as const

export const TIMEFRAMES = [
  { value: 'ASAP', label: 'As soon as possible' },
  { value: 'THIS_WEEK', label: 'Within the next week' },
  { value: 'FORTNIGHT', label: 'Within a fortnight' },
  { value: 'FLEXIBLE', label: 'Flexible, no rush' },
] as const

export interface MemberFilters {
  trade: string
  where: string
  availableOnly: boolean
}

export const NO_FILTERS: MemberFilters = { trade: 'all', where: '', availableOnly: false }

export function filtersActive(f: MemberFilters): boolean {
  return f.trade !== 'all' || f.where.trim() !== '' || f.availableOnly
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/[,]+/g, ' ').replace(/\s+/g, ' ').trim()
}

/** "Brunswick, VIC 3056", "brunswick", "3056" and "Brunswick VIC" all work. */
export function matchesLocation(member: NetworkMember, query: string): boolean {
  const q = normalise(query)
  if (!q) return true
  const postcode = q.match(/\b\d{4}\b/)?.[0]
  const words = q
    .replace(/\b\d{4}\b/, '')
    .replace(/\b(nsw|vic|qld|sa|wa|tas|nt|act)\b/, '')
    .trim()

  if (postcode && member.postcode !== postcode) return false
  if (!words) return true
  const places = [member.suburb, ...member.serviceAreas].map(normalise)
  return places.some((p) => p.includes(words) || words.includes(p))
}

export function filterMembers(members: NetworkMember[], f: MemberFilters): NetworkMember[] {
  return members.filter((m) => {
    if (f.trade !== 'all' && !m.trades.includes(f.trade)) return false
    if (f.availableOnly && !m.available) return false
    return matchesLocation(m, f.where)
  })
}

/** Illustrative profiles. Names and details are invented and carry a visible SAMPLE tag. */
export const SAMPLE_MEMBERS: NetworkMember[] = [
  {
    id: 'sample-maria-costa',
    name: 'Maria Costa',
    trade: 'tiling',
    trades: ['tiling'],
    tradeLabel: 'Tiling',
    suburb: 'Brunswick',
    state: 'VIC',
    postcode: '3056',
    serviceAreas: ['Coburg', 'Northcote', 'Fitzroy'],
    tagline: 'Bathrooms, splashbacks and floors laid to a straight line.',
    bio: 'Tiler for 9 years, specialising in bathrooms and kitchen splashbacks. Tidy site, clear quotes, and photos at every stage.',
    years: 9,
    available: true,
    availabilityNote: 'Booking 2 to 3 weeks out. Weekends by arrangement.',
    qualifications: ['Certificate III in Wall and Floor Tiling', 'Waterproofing certified'],
    licence: true,
    insured: true,
    abn: true,
    mentor: true,
    photoUrl: null,
    sample: true,
  },
  {
    id: 'sample-kate-donnelly',
    name: 'Kate Donnelly',
    trade: 'electrical',
    trades: ['electrical'],
    tradeLabel: 'Electrical',
    suburb: 'Fitzroy',
    state: 'VIC',
    postcode: '3065',
    serviceAreas: ['Collingwood', 'Carlton', 'Richmond'],
    tagline: 'Power points, lighting and safety switches, explained as we go.',
    bio: 'Licensed electrician for 12 years. Happy to walk you through what is wrong, what it costs and what can wait.',
    years: 12,
    available: true,
    availabilityNote: 'Weekday call-outs, usually within the week.',
    qualifications: ['Licensed electrical contractor', 'Certificate III in Electrotechnology'],
    licence: true,
    insured: true,
    abn: true,
    mentor: false,
    photoUrl: null,
    sample: true,
  },
  {
    id: 'sample-sophie-nguyen',
    name: 'Sophie Nguyen',
    trade: 'plumbing',
    trades: ['plumbing'],
    tradeLabel: 'Plumbing',
    suburb: 'Yarraville',
    state: 'VIC',
    postcode: '3013',
    serviceAreas: ['Footscray', 'Seddon', 'Newport'],
    tagline: 'Leaks, hot water and blocked drains, fixed the first visit.',
    bio: 'Plumber and gasfitter for 7 years. Fixed-price quotes in writing before any work starts.',
    years: 7,
    available: false,
    availabilityNote: 'Fully booked this fortnight. Taking enquiries for the following week.',
    qualifications: ['Licensed plumber', 'Certificate III in Plumbing'],
    licence: true,
    insured: true,
    abn: true,
    mentor: false,
    photoUrl: null,
    sample: true,
  },
  {
    id: 'sample-jo-brennan',
    name: 'Jo Brennan',
    trade: 'carpentry',
    trades: ['carpentry'],
    tradeLabel: 'Carpentry & Joinery',
    suburb: 'Brunswick',
    state: 'VIC',
    postcode: '3056',
    serviceAreas: ['Brunswick East', 'Moreland', 'Thornbury'],
    tagline: 'Doors, decks and built-in joinery, measured twice.',
    bio: 'Carpenter and joiner for 15 years. Door hanging, deck repairs and custom shelving for older Melbourne homes.',
    years: 15,
    available: true,
    availabilityNote: 'Small jobs within a week. Larger builds quoted on site.',
    qualifications: ['Certificate III in Carpentry', 'Registered domestic builder (carpentry)'],
    licence: true,
    insured: true,
    abn: true,
    mentor: true,
    photoUrl: null,
    sample: true,
  },
  {
    id: 'sample-amy-whitlock',
    name: 'Amy Whitlock',
    trade: 'painting',
    trades: ['painting'],
    tradeLabel: 'Painting',
    suburb: 'Fitzroy',
    state: 'VIC',
    postcode: '3065',
    serviceAreas: ['Clifton Hill', 'Collingwood', 'Abbotsford'],
    tagline: 'Careful prep and clean lines, inside and out.',
    bio: 'Painter for 10 years, working mostly on terrace homes. Furniture moved, floors covered, and left spotless.',
    years: 10,
    available: true,
    availabilityNote: 'Starting within 2 weeks. Interiors year-round.',
    qualifications: ['Certificate III in Painting and Decorating', 'Lead paint safety trained'],
    licence: true,
    insured: true,
    abn: true,
    mentor: false,
    photoUrl: null,
    sample: true,
  },
  {
    id: 'sample-tahlia-murray',
    name: 'Tahlia Murray',
    trade: 'handyman',
    trades: ['handyman', 'carpentry'],
    tradeLabel: 'Handyman & Odd Jobs',
    suburb: 'Yarraville',
    state: 'VIC',
    postcode: '3013',
    serviceAreas: ['Seddon', 'Spotswood', 'Williamstown'],
    tagline: 'The odd jobs list, done in one visit.',
    bio: 'Handywoman for 6 years. Shelves, doors, flat-pack, gates and the small jobs that never get done.',
    years: 6,
    available: true,
    availabilityNote: 'Most weekdays and Saturdays.',
    qualifications: ['Certificate III in Carpentry', 'Working with Children Check'],
    licence: true,
    insured: true,
    abn: true,
    mentor: false,
    photoUrl: null,
    sample: true,
  },
  {
    id: 'sample-lena-papadopoulos',
    name: 'Lena Papadopoulos',
    trade: 'plumbing',
    trades: ['plumbing'],
    tradeLabel: 'Plumbing',
    suburb: 'Fitzroy',
    state: 'VIC',
    postcode: '3065',
    serviceAreas: ['Carlton', 'North Melbourne', 'Brunswick'],
    tagline: 'Bathroom and kitchen plumbing for renovations and repairs.',
    bio: 'Plumber for 14 years. Renovation rough-ins, tap and toilet replacements, and tidy finishing.',
    years: 14,
    available: true,
    availabilityNote: 'Booking a week ahead.',
    qualifications: ['Licensed plumber', 'Backflow prevention accredited'],
    licence: true,
    insured: true,
    abn: true,
    mentor: true,
    photoUrl: null,
    sample: true,
  },
  {
    id: 'sample-ruby-henderson',
    name: 'Ruby Henderson',
    trade: 'handyman',
    trades: ['handyman', 'painting'],
    tradeLabel: 'Handyman & Odd Jobs',
    suburb: 'Brunswick',
    state: 'VIC',
    postcode: '3056',
    serviceAreas: ['Coburg', 'Pascoe Vale', 'Carlton North'],
    tagline: 'Patch, paint and put things back together.',
    bio: 'Handywoman for 4 years. Wall repairs, touch-up painting, curtain rails and fittings.',
    years: 4,
    available: false,
    availabilityNote: 'On leave until next month. Booking from then.',
    qualifications: ['Certificate II in Construction', 'Working with Children Check'],
    licence: true,
    insured: true,
    abn: true,
    mentor: false,
    photoUrl: null,
    sample: true,
  },
]

/** Real members first, then labelled samples until the grid has `target` cards. */
export function withSamples(real: NetworkMember[], target = 8): NetworkMember[] {
  if (process.env.SHOW_SAMPLE_TRADIES === '0' || real.length >= target) return real
  return [...real, ...SAMPLE_MEMBERS.slice(0, target - real.length)]
}

/** Community Notice Board copy for the public page. */
export const NOTICE_BOARD = [
  { id: 'welcome', kind: 'New member', text: 'Welcome, Maria!', detail: 'New Tiler (Melbourne, VIC)' },
  { id: 'circle', kind: 'Mentorship', text: 'Mentorship Circle', detail: 'Thursday evenings' },
  {
    id: 'workshop',
    kind: 'Workshop',
    text: 'Upcoming Workshop',
    detail: 'Quoting & Business Skills for Tradies',
  },
] as const
