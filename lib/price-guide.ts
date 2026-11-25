/**
 * Indicative, GST-inclusive price lines for the homepage Price Board.
 * Each trade's overall band matches TRADE_CATEGORIES (typicalFrom/typicalTo).
 * These are guides to set expectations; real quotes come from tradies.
 */
export interface PriceLine {
  job: string
  from: number
  to: number
  note?: string
}

export interface PriceGuide {
  slug: string
  label: string
  lines: PriceLine[]
}

export const PRICE_GUIDE: PriceGuide[] = [
  {
    slug: 'handyman',
    label: 'Home Handyman',
    lines: [
      { job: 'Mount a TV on a wall bracket', from: 85, to: 160, note: 'Bracket supplied by you' },
      { job: 'Hang a set of three shelves', from: 95, to: 180 },
      { job: 'Adjust a sticking door or window', from: 85, to: 140 },
      { job: 'Assemble a flat-pack wardrobe', from: 120, to: 260 },
      { job: 'Replace a lock or door handle', from: 90, to: 180 },
      { job: 'Repair a gate or a fence panel', from: 120, to: 450 },
    ],
  },
  {
    slug: 'plumbing',
    label: 'Plumbing',
    lines: [
      { job: 'Fix a leaking tap (washer or cartridge)', from: 120, to: 220 },
      { job: 'Clear a blocked sink or shower drain', from: 150, to: 380 },
      { job: 'Repair a running toilet or cistern', from: 140, to: 320 },
      { job: 'Replace a mixer tap', from: 180, to: 420 },
      { job: 'Hot water system fault repair', from: 220, to: 650 },
      { job: 'Burst or leaking pipe repair', from: 280, to: 900 },
    ],
  },
  {
    slug: 'electrical',
    label: 'Electrical',
    lines: [
      { job: 'Add or replace a power point', from: 140, to: 240 },
      { job: 'Install a ceiling fan', from: 180, to: 380 },
      { job: 'Swap in new downlights (each)', from: 95, to: 160 },
      { job: 'Smoke alarm supply and fit', from: 140, to: 300 },
      { job: 'Replace a safety switch', from: 220, to: 480 },
      { job: 'Switchboard fault repair', from: 250, to: 650 },
    ],
  },
  {
    slug: 'carpentry',
    label: 'Carpentry',
    lines: [
      { job: 'Hang an internal door', from: 180, to: 450 },
      { job: 'Replace skirting boards (one room)', from: 220, to: 520 },
      { job: 'Repair or replace deck boards', from: 250, to: 900 },
      { job: 'Replace rotten fascia or eaves', from: 300, to: 800 },
      { job: 'Built-in shelving or a window seat', from: 600, to: 1800 },
      { job: 'Small deck or pergola', from: 2500, to: 4500, note: 'Depends heavily on size' },
    ],
  },
]

export function aud(n: number): string {
  return `$${n.toLocaleString('en-AU')}`
}

export function range(from: number, to: number): string {
  return `${aud(from)}–${aud(to)}`
}

/** Per-job guides for the Odd Jobs Bundler. */
export interface OddJob {
  id: string
  label: string
  detail: string
  from: number
  to: number
}

export const ODD_JOBS: OddJob[] = [
  { id: 'tap', label: 'Fix a leaking tap', detail: 'Washer or cartridge swap', from: 120, to: 220 },
  { id: 'tv', label: 'Hang a TV bracket', detail: 'Mount it and tidy the cables', from: 85, to: 160 },
  { id: 'door', label: 'Adjust a sticking door', detail: 'Plane, re-hang or re-hinge', from: 85, to: 140 },
  { id: 'shelves', label: 'Put up shelves', detail: 'Correct wall anchors included', from: 95, to: 180 },
  { id: 'flatpack', label: 'Assemble flat-pack furniture', detail: 'Wardrobes, beds, desks', from: 120, to: 260 },
  { id: 'lock', label: 'Replace a lock or handle', detail: 'Door, window or gate', from: 90, to: 180 },
  { id: 'gate', label: 'Fix a gate or fence panel', detail: 'Latch, hinge or paling', from: 120, to: 450 },
  { id: 'smoke', label: 'Fit smoke alarms', detail: 'Supply and install', from: 140, to: 300 },
]
