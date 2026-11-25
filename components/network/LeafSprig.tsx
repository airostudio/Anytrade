/** Soft botanical linework used as a quiet decorative accent. Purely decorative. */
export function LeafSprig({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 320"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M100 312 C 96 250, 104 190, 98 120 C 95 80, 100 40, 108 8" />
      {[
        [98, 270, -1, 34],
        [100, 232, 1, 38],
        [98, 192, -1, 40],
        [100, 152, 1, 40],
        [99, 112, -1, 34],
        [102, 76, 1, 28],
        [105, 44, -1, 22],
      ].map(([x, y, side, len], i) => {
        const s = side as number
        const l = len as number
        const x0 = x as number
        const y0 = y as number
        return (
          <g key={i}>
            <path d={`M${x0} ${y0} C ${x0 + s * l * 0.6} ${y0 - l * 0.9}, ${x0 + s * l * 1.5} ${y0 - l * 0.7}, ${x0 + s * l * 1.8} ${y0 - l * 1.3} C ${x0 + s * l * 0.9} ${y0 - l * 1.3}, ${x0 + s * l * 0.2} ${y0 - l * 0.6}, ${x0} ${y0} Z`} />
            <path d={`M${x0} ${y0} L ${x0 + s * l * 1.3} ${y0 - l * 0.95}`} strokeWidth="1" opacity="0.6" />
          </g>
        )
      })}
    </svg>
  )
}

/** A smaller twin leaf, for corners and card backgrounds. */
export function LeafPair({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d="M60 116 C 60 90, 58 70, 60 44" />
      <path d="M60 96 C 36 92, 22 76, 20 52 C 44 54, 58 70, 60 96 Z" />
      <path d="M60 78 C 84 74, 98 58, 100 34 C 76 36, 62 52, 60 78 Z" />
      <path d="M60 96 L 32 66" strokeWidth="1" opacity="0.6" />
      <path d="M60 78 L 90 48" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}
