import Link from 'next/link'
import type { ReactNode } from 'react'

/** A painted enamel panel — the workhorse container across the site. */
export function Panel({
  children,
  className = '',
  tone = 'canvas',
}: {
  children: ReactNode
  className?: string
  tone?: 'canvas' | 'navy' | 'manila' | 'mustard' | 'oxide' | 'bottle'
}) {
  const tones = {
    canvas: 'bg-canvas text-ink',
    navy: 'bg-navy text-canvas',
    manila: 'bg-manila text-ink',
    mustard: 'bg-mustard text-ink',
    oxide: 'bg-oxide text-canvas',
    bottle: 'bg-bottle text-canvas',
  }
  return (
    <div className={`border-[3px] border-ink shadow-hard ${tones[tone]} ${className}`}>{children}</div>
  )
}

/** Rubber-stamp style badge. */
export function Stamp({
  children,
  tone = 'oxide',
  className = '',
}: {
  children: ReactNode
  tone?: 'oxide' | 'bottle' | 'navy' | 'mustard' | 'ink'
  className?: string
}) {
  const tones = {
    oxide: 'border-oxide text-oxide',
    bottle: 'border-bottle text-bottle',
    navy: 'border-navy text-navy',
    mustard: 'border-mustard-deep text-mustard-deep',
    ink: 'border-ink text-ink',
  }
  return <span className={`stamp ${tones[tone]} ${className}`}>{children}</span>
}

/** Flat status pill (not rotated), used in tables and cards. */
export function Pill({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 border-2 px-2 py-0.5 font-sign text-[11px] font-bold uppercase tracking-widest ${className}`}
    >
      {children}
    </span>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  blurb,
  align = 'left',
  action,
}: {
  eyebrow?: string
  title: string
  blurb?: string
  align?: 'left' | 'center'
  action?: ReactNode
}) {
  return (
    <div
      className={`mb-8 ${align === 'center' ? 'text-center' : 'flex flex-wrap items-end justify-between gap-4'}`}
    >
      <div className={align === 'center' ? 'mx-auto max-w-2xl' : ''}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="text-3xl font-bold uppercase text-ink sm:text-4xl">{title}</h2>
        {blurb ? <p className="mt-3 max-w-2xl text-lg text-ink-soft">{blurb}</p> : null}
      </div>
      {action}
    </div>
  )
}

/** Hazard-tape rule used between major sections. */
export function TapeDivider() {
  return <div className="hazard-tape" aria-hidden />
}

export function EmptyState({
  title,
  blurb,
  action,
  icon = '🧰',
}: {
  title: string
  blurb?: string
  action?: ReactNode
  icon?: string
}) {
  return (
    <div className="border-[3px] border-dashed border-ink/40 bg-canvas-deep/60 px-6 py-14 text-center">
      <div className="mb-3 text-4xl" aria-hidden>
        {icon}
      </div>
      <h3 className="font-sign text-xl font-bold uppercase tracking-wide text-ink">{title}</h3>
      {blurb ? <p className="mx-auto mt-2 max-w-md text-ink-soft">{blurb}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

/** Headline number on a slab, for dashboards. */
export function StatTile({
  label,
  value,
  hint,
  tone = 'canvas',
  href,
}: {
  label: string
  value: ReactNode
  hint?: string
  tone?: 'canvas' | 'navy' | 'safety' | 'bottle' | 'oxide' | 'mustard'
  href?: string
}) {
  const tones = {
    canvas: 'bg-canvas text-ink',
    navy: 'bg-navy text-canvas',
    safety: 'bg-safety text-ink',
    bottle: 'bg-bottle text-canvas',
    oxide: 'bg-oxide text-canvas',
    mustard: 'bg-mustard text-ink',
  }
  const inner = (
    <div className={`h-full border-[3px] border-ink px-4 py-4 shadow-hard-sm ${tones[tone]}`}>
      <p className="font-sign text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-80">{hint}</p> : null}
    </div>
  )
  return href ? (
    <Link href={href} className="block card-lift">
      {inner}
    </Link>
  ) : (
    inner
  )
}

/** Shown when DATABASE_URL is missing or unreachable. */
export function DatabaseNotice() {
  return (
    <Panel tone="mustard" className="p-5">
      <p className="font-sign text-lg font-bold uppercase tracking-wide">Database not connected</p>
      <p className="mt-2 text-sm text-ink-soft">
        Set <code className="bg-ink/10 px-1 font-mono">DATABASE_URL</code> in your{' '}
        <code className="bg-ink/10 px-1 font-mono">.env</code>, then run{' '}
        <code className="bg-ink/10 px-1 font-mono">npm run db:setup</code> and{' '}
        <code className="bg-ink/10 px-1 font-mono">npm run db:seed</code>. The pages still render — they
        are just showing nothing to list.
      </p>
    </Panel>
  )
}
