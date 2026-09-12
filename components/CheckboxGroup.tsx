'use client'

import { useState } from 'react'

/** Multi-select chips used for trades and service areas on the tradie profile. */
export default function CheckboxGroup({
  name,
  options,
  defaultValue = [],
  columns = 2,
}: {
  name: string
  options: { value: string; label: string }[]
  defaultValue?: string[]
  columns?: 1 | 2 | 3
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue)

  const toggle = (value: string) =>
    setSelected((current) =>
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    )

  const cols = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' }[columns]

  return (
    <div className={`grid gap-2 ${cols}`}>
      {options.map((option) => {
        const on = selected.includes(option.value)
        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-2.5 border-[3px] border-ink px-3 py-2 text-sm transition-colors ${
              on ? 'bg-mustard font-bold' : 'bg-canvas hover:bg-canvas-deep'
            }`}
          >
            <input
              type="checkbox"
              checked={on}
              onChange={() => toggle(option.value)}
              className="h-4 w-4 accent-oxide"
            />
            <span>{option.label}</span>
            {on ? <input type="hidden" name={name} value={option.value} /> : null}
          </label>
        )
      })}
    </div>
  )
}
