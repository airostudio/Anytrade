import Link from 'next/link'
import { signOutAction } from '@/app/actions/auth'
import { NavIcon, type IconName } from './icons'

export interface NavItem {
  href: string
  label: string
  icon: IconName
  badge?: number
}

/** Sub-navigation strip used by both the homeowner and tradie dashboards. */
export default function DashboardNav({
  items,
  title,
  subtitle,
}: {
  items: NavItem[]
  title: string
  subtitle?: string
}) {
  return (
    <div className="bg-navy text-white">
      <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {title}
            </h1>
            {subtitle ? <p className="mt-1.5 text-[15px] text-white/80">{subtitle}</p> : null}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-white/30 px-3.5 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </div>

        <nav aria-label="Dashboard" className="mt-6 flex gap-1 overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-t-xl bg-white/[0.07] px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-white/15"
            >
              <NavIcon name={item.icon} />
              {item.label}
              {item.badge ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-safety px-1.5 text-xs font-bold text-ink">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
