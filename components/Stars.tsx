import { rating1dp } from '@/lib/utils'

/** Read-only star row. Half stars are rendered with a clipped overlay. */
export default function Stars({
  value,
  size = 'md',
  showValue = false,
  count,
  className = '',
  tone = 'light',
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  count?: number
  className?: string
  /** Use 'dark' on navy or charcoal surfaces. */
  tone?: 'light' | 'dark'
}) {
  const px = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' }[size]
  const pct = Math.max(0, Math.min(100, (value / 5) * 100))

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`relative inline-block leading-none ${px}`}
        role="img"
        aria-label={`${rating1dp(value)} out of 5 stars`}
      >
        <span className={tone === 'dark' ? 'text-white/30' : 'text-ink/25'}>★★★★★</span>
        <span
          className={`absolute inset-0 overflow-hidden whitespace-nowrap ${tone === 'dark' ? 'text-safety-soft' : 'text-safety-deep'}`}
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          ★★★★★
        </span>
      </span>
      {showValue ? (
        <span className={`font-sign text-sm font-semibold ${tone === 'dark' ? 'text-white' : 'text-ink'}`}>
          {rating1dp(value)}
          {typeof count === 'number' ? (
            <span className={`ml-1 font-body text-xs font-normal ${tone === 'dark' ? 'text-white/80' : 'text-ink-mute'}`}>({count})</span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
