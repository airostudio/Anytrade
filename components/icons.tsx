import {
  Briefcase,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Heart,
  HardHat,
  IdCard,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Pin,
  Plus,
  Radar,
  ScrollText,
  Search,
  Settings,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Wrench,
  FileText,
  Hammer,
  type LucideIcon,
} from 'lucide-react'

/**
 * Named icons for navigation and empty states. Pages pass a key instead of an
 * emoji, so every icon on the site is the same Lucide stroke style.
 */
export const ICONS = {
  dashboard: LayoutDashboard,
  overview: LayoutGrid,
  users: Users,
  tradies: Hammer,
  jobs: ClipboardList,
  quotes: FileText,
  payments: CreditCard,
  earnings: Wallet,
  reviews: Star,
  homegirls: Heart,
  enquiries: Mail,
  analytics: TrendingUp,
  audit: ScrollText,
  settings: Settings,
  plus: Plus,
  leads: Radar,
  won: CheckCircle2,
  listing: IdCard,
  inbox: Inbox,
  search: Search,
  pin: Pin,
  hardhat: HardHat,
  toolbox: Briefcase,
  wrench: Wrench,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONS

export function NavIcon({ name, className = 'h-4 w-4' }: { name: IconName; className?: string }) {
  const Icon = ICONS[name] ?? Wrench
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />
}
