import type { LucideIcon } from 'lucide-react'

/** Shared building blocks for the homepage. Server-safe: no hooks in here. */

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta px-6 py-3.5 text-base font-semibold text-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_8px_20px_-10px_rgba(217,93,57,.8)] transition hover:bg-terracotta-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60'

/** Primary action colour on the Homegirls Network page (copper, near-black text). */
export const btnCopper =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-hg-copper px-6 py-3.5 text-base font-semibold text-hg-on-copper shadow-[inset_0_1px_0_rgba(255,255,255,.3),0_8px_20px_-10px_rgba(169,83,46,.8)] transition hover:bg-hg-copper-hover active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60'

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-charcoal/20 bg-white px-5 py-3 text-[15px] font-semibold text-charcoal transition hover:border-charcoal/50 hover:bg-alabaster active:translate-y-px'

export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[15px] font-semibold text-charcoal transition hover:bg-charcoal/5'

export const fieldCls =
  'w-full rounded-xl border border-charcoal/20 bg-white px-4 py-3 text-base text-charcoal placeholder:text-charcoal-mute/70 transition hover:border-charcoal/40 focus:border-charcoal focus:outline-none'

type Tone = 'terracotta' | 'verified' | 'charcoal'

const TONES: Record<Tone, string> = {
  terracotta: 'bg-terracotta-tint text-terracotta-deep',
  verified: 'bg-verified-tint text-verified-deep',
  charcoal: 'bg-charcoal/5 text-charcoal',
}

/** Lucide icon inside a subtle tinted container, the one icon treatment used site-wide. */
export function IconTile({
  icon: Icon,
  tone = 'terracotta',
  size = 'md',
}: {
  icon: LucideIcon
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
}) {
  const box = { sm: 'h-9 w-9 rounded-lg', md: 'h-11 w-11 rounded-xl', lg: 'h-14 w-14 rounded-2xl' }[size]
  const icon = { sm: 'h-[18px] w-[18px]', md: 'h-5 w-5', lg: 'h-7 w-7' }[size]
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${box} ${TONES[tone]}`}>
      <Icon className={icon} strokeWidth={1.75} aria-hidden="true" />
    </span>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = 'left',
  id,
}: {
  eyebrow?: string
  title: string
  lead?: string
  align?: 'left' | 'center'
  id?: string
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? (
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-terracotta-deep">{eyebrow}</p>
      ) : null}
      <h2
        id={id}
        className="mt-2 font-heritage text-3xl font-semibold leading-tight tracking-tight text-charcoal sm:text-4xl"
      >
        {title}
      </h2>
      {lead ? <p className="mt-3 text-lg leading-relaxed text-charcoal-mute">{lead}</p> : null}
    </div>
  )
}

/** Eucalyptus green is reserved for verification and trust. Nothing else uses it. */
export function VerifiedPill({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-verified-tint px-2.5 py-1 text-xs font-semibold text-verified-deep">
      <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  )
}

export const container = 'mx-auto w-full max-w-6xl px-5 sm:px-8'
