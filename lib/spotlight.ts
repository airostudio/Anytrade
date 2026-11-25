import { categoryName } from './constants'
import { safeRead } from './db'
import { searchTradies } from './repos/tradies'

/** What a Spotlight card shows. Never a street address or a phone number. */
export interface SpotlightTradie {
  id: string
  name: string
  trade: string
  tradeSlug: string
  tagline: string
  suburb: string
  state: string
  radiusKm: number | null
  years: number | null
  hourlyRate: number | null
  freeQuote: boolean
  licence: boolean
  insured: boolean
  abn: boolean
  homegirl: boolean
  profileHref: string | null
  /** True for illustrative profiles, which the card labels as samples. */
  sample: boolean
}

/**
 * Illustrative profiles used while the directory fills up, so the layout can be
 * judged with realistic content. They are labelled on the card and switched off
 * with SHOW_SAMPLE_TRADIES=0.
 */
const SAMPLES: SpotlightTradie[] = [
  {
    id: 'sample-handyman',
    name: 'Dale T.',
    trade: 'Home Handyman',
    tradeSlug: 'handyman',
    tagline: 'Sticking doors, shelves and the odd jobs list. One visit, tidy finish.',
    suburb: 'Parramatta',
    state: 'NSW',
    radiusKm: 25,
    years: 20,
    hourlyRate: 70,
    freeQuote: true,
    licence: true,
    insured: true,
    abn: true,
    homegirl: false,
    profileHref: null,
    sample: true,
  },
  {
    id: 'sample-plumber',
    name: 'Mark O.',
    trade: 'Plumbing',
    tradeSlug: 'plumbing',
    tagline: 'Taps, toilets and blocked drains. Fixed-price quotes in writing.',
    suburb: 'Brunswick',
    state: 'VIC',
    radiusKm: 20,
    years: 18,
    hourlyRate: 95,
    freeQuote: true,
    licence: true,
    insured: true,
    abn: true,
    homegirl: false,
    profileHref: null,
    sample: true,
  },
  {
    id: 'sample-carpenter',
    name: 'Jess W.',
    trade: 'Carpentry',
    tradeSlug: 'carpentry',
    tagline: 'Doors, decks and built-ins. Measured twice, cut once.',
    suburb: 'Chermside',
    state: 'QLD',
    radiusKm: 30,
    years: 12,
    hourlyRate: 85,
    freeQuote: true,
    licence: true,
    insured: true,
    abn: true,
    homegirl: true,
    profileHref: null,
    sample: true,
  },
]

const WANTED = 3

export async function getSpotlightTradies(): Promise<SpotlightTradie[]> {
  const real = await safeRead(
    () => searchTradies({ verifiedOnly: true, sort: 'recommended', limit: WANTED }),
    []
  )

  const live: SpotlightTradie[] = real.map((t) => {
    const insured = Boolean(t.insurer_name) && (!t.insurance_expiry || new Date(t.insurance_expiry) > new Date())
    return {
      id: t.id,
      name: t.name,
      trade: categoryName(t.trades[0] ?? 'handyman'),
      tradeSlug: t.trades[0] ?? 'handyman',
      tagline: t.tagline ?? '',
      suburb: t.base_suburb ?? '',
      state: t.state ?? '',
      radiusKm: t.travel_radius_km ?? null,
      years: t.years_experience,
      hourlyRate: t.hourly_rate,
      freeQuote: t.free_quotes,
      licence: Boolean(t.licence_number),
      insured,
      abn: Boolean(t.abn),
      homegirl: t.is_homegirl,
      profileHref: `/find-a-tradie/${t.slug}`,
      sample: false,
    }
  })

  if (live.length >= WANTED || process.env.SHOW_SAMPLE_TRADIES === '0') return live.slice(0, WANTED)
  return [...live, ...SAMPLES.slice(0, WANTED - live.length)]
}
