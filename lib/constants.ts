/** Catalogue data that drives the directory, job forms and landing pages. */

export interface TradeCategory {
  slug: string
  name: string
  icon: string
  blurb: string
  /** Typical all-up price band for a small job, in AUD. */
  typicalFrom: number
  typicalTo: number
  common: string[]
  handyman?: boolean
}

export const TRADE_CATEGORIES: TradeCategory[] = [
  {
    slug: 'handyman',
    name: 'Home Handyman',
    icon: '🔩',
    blurb: 'The odd jobs nobody else will turn up for. Two hours or two days, done properly.',
    typicalFrom: 85,
    typicalTo: 450,
    common: ['Flat-pack assembly', 'Shelves & brackets', 'Door adjustments', 'Picture hanging', 'Gate repairs'],
    handyman: true,
  },
  {
    slug: 'plumbing',
    name: 'Plumbing',
    icon: '🚿',
    blurb: 'Dripping taps, blocked drains, hot water and the burst pipe at 6am.',
    typicalFrom: 120,
    typicalTo: 900,
    common: ['Leaking taps', 'Blocked drains', 'Toilet repairs', 'Hot water systems', 'Burst pipes'],
    handyman: true,
  },
  {
    slug: 'electrical',
    name: 'Electrical',
    icon: '💡',
    blurb: 'Licensed sparkies for power points, lights, fans and switchboards.',
    typicalFrom: 140,
    typicalTo: 1200,
    common: ['Power points', 'Downlights', 'Ceiling fans', 'Switchboard upgrades', 'Safety switches'],
  },
  {
    slug: 'carpentry',
    name: 'Carpentry',
    icon: '🪚',
    blurb: 'Decks, doors, skirting, pergolas and everything made of timber.',
    typicalFrom: 180,
    typicalTo: 4500,
    common: ['Decking', 'Door hanging', 'Skirting & architraves', 'Pergolas', 'Built-in shelving'],
    handyman: true,
  },
  {
    slug: 'painting',
    name: 'Painting',
    icon: '🖌️',
    blurb: 'Interior and exterior, prepped properly so it lasts more than a season.',
    typicalFrom: 250,
    typicalTo: 6000,
    common: ['Interior repaint', 'Exterior repaint', 'Feature walls', 'Ceilings', 'Fence staining'],
    handyman: true,
  },
  {
    slug: 'tiling',
    name: 'Tiling',
    icon: '🧱',
    blurb: 'Bathrooms, splashbacks, floors and regrouting that actually seals.',
    typicalFrom: 220,
    typicalTo: 5500,
    common: ['Bathroom tiling', 'Splashbacks', 'Regrouting', 'Floor tiles', 'Waterproofing'],
  },
  {
    slug: 'plastering',
    name: 'Plastering & Gyprock',
    icon: '🧰',
    blurb: 'Patch the hole, set the joins, skim the wall. No visible repair.',
    typicalFrom: 150,
    typicalTo: 2800,
    common: ['Wall patching', 'Cornice repair', 'Gyprock sheeting', 'Ceiling repair', 'Skim coating'],
    handyman: true,
  },
  {
    slug: 'roofing',
    name: 'Roofing & Gutters',
    icon: '🏠',
    blurb: 'Leaks, broken tiles, gutter cleans and whirlybirds.',
    typicalFrom: 180,
    typicalTo: 9000,
    common: ['Leak repairs', 'Gutter cleaning', 'Tile replacement', 'Downpipes', 'Roof restoration'],
  },
  {
    slug: 'landscaping',
    name: 'Landscaping & Gardens',
    icon: '🌿',
    blurb: 'Mowing, hedging, turf, retaining walls and green-waste runs.',
    typicalFrom: 90,
    typicalTo: 7000,
    common: ['Lawn mowing', 'Hedge trimming', 'Turf laying', 'Retaining walls', 'Garden clean-ups'],
    handyman: true,
  },
  {
    slug: 'fencing',
    name: 'Fencing & Gates',
    icon: '🚧',
    blurb: 'Colorbond, paling, pool fencing and the gate that has never closed right.',
    typicalFrom: 200,
    typicalTo: 6500,
    common: ['Paling fences', 'Colorbond', 'Gate repairs', 'Pool fencing', 'Fence painting'],
    handyman: true,
  },
  {
    slug: 'concreting',
    name: 'Concreting',
    icon: '🏗️',
    blurb: 'Driveways, paths, slabs and shed pads poured straight and level.',
    typicalFrom: 600,
    typicalTo: 15000,
    common: ['Driveways', 'Paths', 'Shed slabs', 'Exposed aggregate', 'Concrete repairs'],
  },
  {
    slug: 'bathroom-reno',
    name: 'Bathroom Renovation',
    icon: '🛁',
    blurb: 'Full bathroom fit-outs coordinated by one tradie who owns the job.',
    typicalFrom: 8000,
    typicalTo: 30000,
    common: ['Full renovation', 'Vanity swap', 'Shower screens', 'Waterproofing', 'Tap & fixture upgrade'],
  },
  {
    slug: 'kitchen-reno',
    name: 'Kitchen Renovation',
    icon: '🍳',
    blurb: 'Benchtops, cabinetry and appliance install without the six-month wait.',
    typicalFrom: 9000,
    typicalTo: 40000,
    common: ['Full renovation', 'Benchtop replacement', 'Cabinet doors', 'Splashbacks', 'Appliance install'],
  },
  {
    slug: 'air-conditioning',
    name: 'Heating & Cooling',
    icon: '❄️',
    blurb: 'Split systems, ducted servicing and the unit that stopped in January.',
    typicalFrom: 160,
    typicalTo: 8000,
    common: ['Split system install', 'AC servicing', 'Ducted repairs', 'Evaporative cooling', 'Gas heaters'],
  },
  {
    slug: 'locksmith',
    name: 'Locksmith & Security',
    icon: '🔐',
    blurb: 'Lockouts, rekeys, deadbolts, window locks and camera installs.',
    typicalFrom: 110,
    typicalTo: 1400,
    common: ['Lockouts', 'Rekeying', 'Deadbolts', 'Window locks', 'Security cameras'],
  },
  {
    slug: 'appliance-repair',
    name: 'Appliance Repair',
    icon: '🔧',
    blurb: 'Washers, dryers, dishwashers and ovens — fixed before replaced.',
    typicalFrom: 110,
    typicalTo: 750,
    common: ['Washing machines', 'Dishwashers', 'Ovens', 'Dryers', 'Rangehoods'],
    handyman: true,
  },
  {
    slug: 'pest-control',
    name: 'Pest Control',
    icon: '🐜',
    blurb: 'Termite inspections, ants, spiders, rodents and possum-proofing.',
    typicalFrom: 130,
    typicalTo: 1200,
    common: ['General pest spray', 'Termite inspection', 'Rodent control', 'Possum removal', 'Ant treatment'],
  },
  {
    slug: 'cleaning',
    name: 'Cleaning',
    icon: '🧽',
    blurb: 'Bond cleans, pressure washing, windows and post-build tidy-ups.',
    typicalFrom: 100,
    typicalTo: 1500,
    common: ['Bond cleaning', 'Pressure washing', 'Window cleaning', 'Carpet steam', 'Post-build clean'],
    handyman: true,
  },
  {
    slug: 'removals',
    name: 'Removals & Rubbish',
    icon: '🚚',
    blurb: 'Two blokes and a truck for moves, deceased estates and hard rubbish.',
    typicalFrom: 120,
    typicalTo: 2200,
    common: ['House moves', 'Rubbish removal', 'Green waste', 'Furniture pickup', 'Garage clear-outs'],
    handyman: true,
  },
  {
    slug: 'glazing',
    name: 'Glazing & Windows',
    icon: '🪟',
    blurb: 'Cracked panes, flyscreens, shower screens and mirror fitting.',
    typicalFrom: 130,
    typicalTo: 2400,
    common: ['Broken windows', 'Flyscreens', 'Shower screens', 'Mirrors', 'Window seals'],
    handyman: true,
  },
]

export function getCategory(slug: string): TradeCategory | undefined {
  return TRADE_CATEGORIES.find((c) => c.slug === slug)
}

export function categoryName(slug: string): string {
  return getCategory(slug)?.name ?? slug
}

/**
 * The Home Handyman list. Small jobs are the heart of the business — most
 * people want one person for an afternoon, not a quote for a renovation.
 */
export const HANDYMAN_SERVICES = [
  'Flat-pack furniture assembly',
  'Shelves, brackets & wall mounting',
  'TV wall mounting',
  'Picture & mirror hanging',
  'Door adjusting & hanging',
  'Lock & handle replacement',
  'Sticking windows & flyscreens',
  'Leaking taps & washers',
  'Toilet & cistern repairs',
  'Silicone & sealing',
  'Wall patching & touch-up paint',
  'Skirting & architrave repair',
  'Gutter cleaning',
  'Fence & gate repairs',
  'Decking board replacement',
  'Curtain rails & blinds',
  'Smoke alarm battery swap',
  'Pet doors',
  'Child safety fittings',
  'Garden tap & hose fittings',
  'Rubbish & green waste runs',
  'Odd jobs list (by the hour)',
]

export const JOB_SIZES = [
  { value: 'ODD_JOB', label: 'Odd job', hint: 'Under 2 hours — the classic handyman call-out' },
  { value: 'HALF_DAY', label: 'Half day', hint: 'A morning or an afternoon' },
  { value: 'FULL_DAY', label: 'Full day', hint: 'One tradie, one full day' },
  { value: 'MULTI_DAY', label: 'A few days', hint: 'Two days to a fortnight' },
  { value: 'LARGE_PROJECT', label: 'Big project', hint: 'Renovation or new build scope' },
] as const

export const JOB_URGENCIES = [
  { value: 'EMERGENCY', label: 'Emergency', hint: 'Today if possible' },
  { value: 'THIS_WEEK', label: 'This week', hint: 'Within the next 7 days' },
  { value: 'NEXT_FORTNIGHT', label: 'Next fortnight', hint: 'Happy to wait a couple of weeks' },
  { value: 'FLEXIBLE', label: 'No rush', hint: 'Whenever suits the tradie' },
] as const

/** Quick-tap compliments, Uber/Didi style. Client rating a tradie. */
export const TRADIE_REVIEW_TAGS = [
  'Turned up on time',
  'Fair price',
  'Clean & tidy',
  'Great communication',
  'Knew their stuff',
  'Went the extra mile',
  'No surprises on the bill',
  'Good with the dog',
  'Explained the problem',
  'Would hire again',
]

/** Tradies rating the client back. */
export const CLIENT_REVIEW_TAGS = [
  'Clear about the job',
  'Easy access on site',
  'Paid promptly',
  'Reasonable expectations',
  'Good communication',
  'Respectful',
  'Ready when I arrived',
  'Would work for again',
]

export const RATING_CRITERIA = [
  { key: 'quality', label: 'Quality of work' },
  { key: 'punctuality', label: 'Turned up on time' },
  { key: 'value', label: 'Value for money' },
  { key: 'communication', label: 'Communication' },
  { key: 'tidiness', label: 'Left it tidy' },
] as const

/** Lead-credit packs a tradie buys through Stripe Checkout. */
export interface CreditPack {
  id: string
  name: string
  credits: number
  priceAud: number
  blurb: string
  popular?: boolean
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'starter', name: 'Smoko Pack', credits: 10, priceAud: 39, blurb: 'Ten leads to test the water.' },
  { id: 'standard', name: 'Toolbox Pack', credits: 30, priceAud: 99, blurb: 'Thirty leads at a better rate.', popular: true },
  { id: 'bulk', name: 'Ute Load', credits: 80, priceAud: 229, blurb: 'Eighty leads for a busy crew.' },
]

export interface MembershipPlan {
  tier: 'FREE' | 'SUBBIE' | 'GUVNOR' | 'MASTER'
  name: string
  monthlyAud: number
  includedCredits: number
  blurb: string
  features: string[]
  popular?: boolean
}

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    tier: 'FREE',
    name: 'Casual',
    monthlyAud: 0,
    includedCredits: 0,
    blurb: 'Pay per lead, no commitment.',
    features: [
      'Listed in the directory',
      'Buy lead credits as you need them',
      'Collect ratings and reviews',
      'Standard search placement',
    ],
  },
  {
    tier: 'SUBBIE',
    name: 'Subbie',
    monthlyAud: 49,
    includedCredits: 15,
    blurb: 'For the one-person operation.',
    features: [
      '15 lead credits included each month',
      'Verified badge once licence is checked',
      'Reply to your reviews',
      'Priority over free listings',
    ],
  },
  {
    tier: 'GUVNOR',
    name: 'Guvnor',
    monthlyAud: 119,
    includedCredits: 45,
    blurb: 'For a small crew keeping the calendar full.',
    features: [
      '45 lead credits included each month',
      'Featured in your service areas',
      'Photo gallery of past work',
      'Job leads emailed the moment they land',
      'Business profile on category pages',
    ],
    popular: true,
  },
  {
    tier: 'MASTER',
    name: 'Master',
    monthlyAud: 249,
    includedCredits: 120,
    blurb: 'For established businesses covering a whole metro area.',
    features: [
      '120 lead credits included each month',
      'Top billing in search results',
      'Unlimited service areas',
      'Homepage rotation',
      'Dedicated account line',
    ],
  },
]

/** Credits charged to bid on a job, scaled by job size. */
export const BID_CREDIT_COST: Record<string, number> = {
  ODD_JOB: 1,
  HALF_DAY: 1,
  FULL_DAY: 2,
  MULTI_DAY: 3,
  LARGE_PROJECT: 5,
}

export const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'] as const

/** A starter list of service areas used by search suggestions and the seed data. */
export const POPULAR_SUBURBS = [
  { suburb: 'Parramatta', city: 'Sydney', state: 'NSW', postcode: '2150' },
  { suburb: 'Newtown', city: 'Sydney', state: 'NSW', postcode: '2042' },
  { suburb: 'Blacktown', city: 'Sydney', state: 'NSW', postcode: '2148' },
  { suburb: 'Manly', city: 'Sydney', state: 'NSW', postcode: '2095' },
  { suburb: 'Bondi', city: 'Sydney', state: 'NSW', postcode: '2026' },
  { suburb: 'Penrith', city: 'Sydney', state: 'NSW', postcode: '2750' },
  { suburb: 'Sutherland', city: 'Sydney', state: 'NSW', postcode: '2232' },
  { suburb: 'Footscray', city: 'Melbourne', state: 'VIC', postcode: '3011' },
  { suburb: 'Brunswick', city: 'Melbourne', state: 'VIC', postcode: '3056' },
  { suburb: 'Dandenong', city: 'Melbourne', state: 'VIC', postcode: '3175' },
  { suburb: 'Geelong', city: 'Geelong', state: 'VIC', postcode: '3220' },
  { suburb: 'Frankston', city: 'Melbourne', state: 'VIC', postcode: '3199' },
  { suburb: 'Ipswich', city: 'Brisbane', state: 'QLD', postcode: '4305' },
  { suburb: 'Chermside', city: 'Brisbane', state: 'QLD', postcode: '4032' },
  { suburb: 'Southport', city: 'Gold Coast', state: 'QLD', postcode: '4215' },
  { suburb: 'Toowoomba', city: 'Toowoomba', state: 'QLD', postcode: '4350' },
  { suburb: 'Norwood', city: 'Adelaide', state: 'SA', postcode: '5067' },
  { suburb: 'Port Adelaide', city: 'Adelaide', state: 'SA', postcode: '5015' },
  { suburb: 'Fremantle', city: 'Perth', state: 'WA', postcode: '6160' },
  { suburb: 'Joondalup', city: 'Perth', state: 'WA', postcode: '6027' },
  { suburb: 'Hobart', city: 'Hobart', state: 'TAS', postcode: '7000' },
  { suburb: 'Belconnen', city: 'Canberra', state: 'ACT', postcode: '2617' },
]

/** Platform commission on escrowed job payments. */
export const PLATFORM_FEE_RATE = 0.075
