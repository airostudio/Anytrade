'use client'

import { useState } from 'react'

/**
 * Tap-a-star rating input. Renders a hidden field so it works inside a plain
 * server-action <form> with no client state plumbing.
 */
export default function StarInput({
  name,
  label,
  defaultValue = 0,
  required = false,
  size = 'lg',
}: {
  name: string
  label: string
  defaultValue?: number
  required?: boolean
  size?: 'sm' | 'lg'
}) {
  const [value, setValue] = useState(defaultValue)
  const [hover, setHover] = useState(0)
  const shown = hover || value
  const px = size === 'lg' ? 'text-4xl' : 'text-2xl'

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="font-sign text-sm font-semibold uppercase tracking-wider text-ink-soft">
        {label}
        {required ? <span className="text-oxide"> *</span> : null}
      </span>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            aria-pressed={value === star}
            onMouseEnter={() => setHover(star)}
            onClick={() => setValue(star === value ? 0 : star)}
            className={`${px} leading-none transition-transform hover:scale-110 ${
              star <= shown ? 'text-safety-deep' : 'text-ink/25'
            }`}
          >
            ★
          </button>
        ))}
        <input type="hidden" name={name} value={value || ''} />
      </div>
    </div>
  )
}
