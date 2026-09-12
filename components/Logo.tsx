import Link from 'next/link'

/**
 * Signwritten wordmark — the sort of thing painted on the door of a ute.
 * Built in CSS so it stays crisp at any size and matches the retro palette.
 */
export default function Logo({
  size = 'md',
  href = '/',
  tone = 'dark',
}: {
  size?: 'sm' | 'md' | 'lg'
  href?: string | null
  tone?: 'dark' | 'light'
}) {
  const scale = {
    sm: { word: 'text-xl', sub: 'text-[7px]', pad: 'px-2 py-1', est: 'text-[7px]' },
    md: { word: 'text-3xl', sub: 'text-[9px]', pad: 'px-3 py-1.5', est: 'text-[8px]' },
    lg: { word: 'text-5xl', sub: 'text-xs', pad: 'px-4 py-2', est: 'text-[10px]' },
  }[size]

  const body = (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-block border-[3px] border-ink ${
          tone === 'light' ? 'bg-canvas' : 'bg-safety'
        } ${scale.pad} shadow-hard-sm`}
      >
        <span className={`block font-display leading-none tracking-tight text-ink ${scale.word}`}>
          ANYTRADE
        </span>
        <span
          className={`mt-0.5 block text-center font-sign font-bold uppercase leading-none tracking-[0.3em] text-ink/80 ${scale.sub}`}
        >
          Handyman &amp; Trades
        </span>
      </span>
      <span
        className={`hidden flex-col items-center border-2 border-ink bg-oxide px-1.5 py-1 font-sign font-bold uppercase leading-tight tracking-widest text-canvas sm:flex ${scale.est}`}
      >
        <span>Est.</span>
        <span>1968</span>
      </span>
    </span>
  )

  if (!href) return body
  return (
    <Link href={href} aria-label="AnyTrade home" className="inline-block">
      {body}
    </Link>
  )
}
