import Link from 'next/link'
import { signOutAction } from '@/app/actions/auth'

export interface NavItem {
  href: string
  label: string
  icon: string
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
    <div className="border-b-[3px] border-ink bg-navy text-canvas">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl leading-none sm:text-3xl">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-canvas/75">{subtitle}</p> : null}
          </div>
          <form action={signOutAction}>
            <button type="submit" className="btn-sm border-2 border-canvas/60 font-sign uppercase tracking-widest text-canvas/80 hover:bg-canvas hover:text-ink">
              Sign out
            </button>
          </form>
        </div>

        <nav className="mt-5 flex flex-wrap gap-1 overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 border-x-2 border-t-2 border-ink bg-canvas-deep px-4 py-2.5 font-sign text-sm font-bold uppercase tracking-wide text-ink transition-colors hover:bg-safety"
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
              {item.badge ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center border-2 border-ink bg-oxide px-1 text-[11px] text-canvas">
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
