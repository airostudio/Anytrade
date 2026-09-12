'use client'

import { useState } from 'react'

/** Quick-tap compliment chips, the way a rideshare app collects them. */
export default function TagPicker({ name, options }: { name: string; options: string[] }) {
  const [selected, setSelected] = useState<string[]>([])

  const toggle = (tag: string) =>
    setSelected((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]
    )

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((tag) => {
        const on = selected.includes(tag)
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(tag)}
            className={`border-[3px] border-ink px-3 py-1.5 font-sign text-xs font-bold uppercase tracking-wider transition-all ${
              on ? 'bg-safety text-ink shadow-hard-sm' : 'bg-canvas text-ink-soft hover:bg-canvas-deep'
            }`}
          >
            {on ? '✓ ' : ''}
            {tag}
          </button>
        )
      })}
      {selected.map((tag) => (
        <input key={tag} type="hidden" name={name} value={tag} />
      ))}
    </div>
  )
}
