import Link from 'next/link'
import type { ReactNode } from 'react'
import { NavIcon, type IconName } from './icons'

/** The workhorse container across the site: a soft white card. */
export function Panel({
  children,
  className = '',
  tone = 'canvas',
  tabIndex,
}: {
  children: ReactNode
  className?: string
  tone?: 'canvas' | 'navy' | 'manila' | 'mustard' | 'oxide' | 'bottle'
  /** Pass 0 when the panel scrolls, so keyboard users can reach its content. */
  tabIndex?: number
}) {
  const tones = {
    canvas: 'border-hairline bg-white text-ink',
    navy: 'border-transparent bg-navy text-white',
    manila: 'border-hairline bg-canvas-deep text-ink',
    mustard: 'border-mustard-deep/20 bg-mustard text-ink',
    oxide: 'border-transparent bg-oxide text-white',
    bottle: 'border-transparent bg-bottle text-white',
  }
  return (
    <div tabIndex={tabIndex} className={`rounded-2xl border shadow-card ${tones[tone]} ${className}`}>
      {children}
    </div>
  )
}

/** Soft status badge. */
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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${className}`}
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
  as: Heading = 'h2',
}: {
  eyebrow?: string
  title: string
  blurb?: string
  align?: 'left' | 'center'
  action?: ReactNode
  as?: 'h1' | 'h2'
}) {
  return (
    <div
      className={`mb-8 ${align === 'center' ? 'text-center' : 'flex flex-wrap items-end justify-between gap-4'}`}
    >
      <div className={align === 'center' ? 'mx-auto max-w-2xl' : ''}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <Heading className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</Heading>
        {blurb ? <p className="mt-3 max-w-2xl text-lg text-ink-soft">{blurb}</p> : null}
      </div>
      {action}
    </div>
  )
}

/** A quiet rule used between major sections. */
export function TapeDivider() {
  return <div className="hazard-tape" aria-hidden />
}

export function EmptyState({
  title,
  blurb,
  action,
  icon = 'toolbox',
}: {
  title: string
  blurb?: string
  action?: ReactNode
  icon?: IconName
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink/25 bg-white px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-tint text-oxide">
        <NavIcon name={icon} className="h-7 w-7" />
      </span>
      <h3 className="font-display text-xl font-semibold tracking-tight text-ink">{title}</h3>
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
    canvas: 'border-hairline bg-white text-ink',
    navy: 'border-transparent bg-navy text-white',
    safety: 'border-transparent bg-safety text-ink',
    bottle: 'border-transparent bg-bottle text-white',
    oxide: 'border-transparent bg-oxide text-white',
    mustard: 'border-mustard-deep/20 bg-mustard text-ink',
  }
  const inner = (
    <div className={`h-full rounded-2xl border px-4 py-4 shadow-card ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-100">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold leading-none">{value}</p>
      {hint ? <p className="mt-2 text-xs opacity-100">{hint}</p> : null}
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
      <p className="font-display text-lg font-semibold">Database not connected</p>
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
