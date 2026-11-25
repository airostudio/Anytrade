'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

/**
 * Accessible modal or side drawer built on the native <dialog>: focus is trapped,
 * Escape closes it, the page behind is inert, and focus returns to the opener.
 */
export default function Dialog({
  title,
  eyebrow,
  variant = 'modal',
  onClose,
  children,
  footer,
}: {
  title: string
  eyebrow?: string
  variant?: 'modal' | 'drawer'
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const html = document.documentElement
    const previous = html.style.overflow
    html.style.overflow = 'hidden'
    return () => {
      html.style.overflow = previous
    }
  }, [])

  const shape =
    variant === 'drawer'
      ? 'm-0 ml-auto h-full max-h-none w-full max-w-md open:animate-drawer-in'
      : 'm-auto w-[calc(100%-1.5rem)] max-w-lg rounded-2xl open:animate-fade-in'

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
      className={`${shape} border-0 bg-white p-0 text-hg-ink shadow-lift backdrop:bg-hg-ink/60 backdrop:backdrop-blur-[2px]`}
    >
      <div className={`flex flex-col ${variant === 'drawer' ? 'h-full' : 'max-h-[min(90vh,46rem)]'}`}>
        <header className="flex items-start justify-between gap-4 border-b border-hg-line px-6 pb-4 pt-5">
          <div>
            {eyebrow ? (
              <p className="text-sm font-semibold text-hg-copper-deep">{eyebrow}</p>
            ) : null}
            <h2 id={titleId} className="mt-0.5 font-heritage text-2xl font-semibold tracking-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-lg p-2 text-hg-slate/70 transition hover:bg-hg-cream hover:text-hg-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          // A scrollable region must be reachable by keyboard so long profiles can be read.
          tabIndex={variant === 'drawer' ? 0 : undefined}
        >
          {children}
        </div>
        {footer ? (
          <footer className="border-t border-hg-line bg-hg-paper px-6 py-4">{footer}</footer>
        ) : null}
      </div>
    </dialog>
  )
}

/** Closes the nearest dialog; used by the "Done" buttons in confirmations. */
export function closeDialogOf(el: HTMLElement | null) {
  el?.closest('dialog')?.close()
}
