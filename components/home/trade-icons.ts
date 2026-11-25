import {
  AppWindow,
  Bath,
  Bug,
  BrickWall,
  CookingPot,
  Droplets,
  Fence,
  Grid2x2,
  Hammer,
  House,
  KeyRound,
  Brush,
  PaintRoller,
  Plug,
  Ruler,
  Snowflake,
  SprayCan,
  Trees,
  Truck,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/** One consistent stroke icon per trade, replacing the emoji set. */
const ICONS: Record<string, LucideIcon> = {
  handyman: Hammer,
  plumbing: Droplets,
  electrical: Zap,
  carpentry: Ruler,
  painting: PaintRoller,
  tiling: Grid2x2,
  plastering: Brush,
  roofing: House,
  landscaping: Trees,
  fencing: Fence,
  concreting: BrickWall,
  'bathroom-reno': Bath,
  'kitchen-reno': CookingPot,
  'air-conditioning': Snowflake,
  locksmith: KeyRound,
  'appliance-repair': Plug,
  'pest-control': Bug,
  cleaning: SprayCan,
  removals: Truck,
  glazing: AppWindow,
}

export function tradeIcon(slug: string): LucideIcon {
  return ICONS[slug] ?? Wrench
}

/** The eight trades shown up front. The rest live in the "all trades" drawer. */
export const POPULAR_TRADE_SLUGS = [
  'handyman',
  'plumbing',
  'electrical',
  'carpentry',
  'painting',
  'tiling',
  'landscaping',
  'cleaning',
] as const
