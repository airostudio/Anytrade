import { rating1dp } from '@/lib/utils'

/** Read-only star row. Half stars are rendered with a clipped overlay. */
export default function Stars({
  value,
  size = 'md',
  showValue = false,
  count,
  className = '',
}: {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  count?: number
  className?: string
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
        <span className="text-ink/25">★★★★★</span>
        <span
          className="absolute inset-0 overflow-hidden whitespace-nowrap text-safety-deep"
          style={{ width: `${pct}%` }}
          aria-hidden
        >
          ★★★★★
        </span>
      </span>
      {showValue ? (
        <span className="font-sign text-sm font-bold tracking-wide text-ink">
          {rating1dp(value)}
          {typeof count === 'number' ? (
            <span className="ml-1 font-body text-xs font-normal text-ink-mute">({count})</span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
