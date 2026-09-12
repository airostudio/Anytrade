'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function MobileNav({
  links,
  signedIn,
  accountHref,
}: {
  links: { href: string; label: string }[]
  signedIn: boolean
  accountHref: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle menu"
        className="border-[3px] border-ink bg-canvas px-3 py-2 font-sign text-sm font-bold uppercase shadow-hard-sm"
      >
        {open ? '✕' : '☰'}
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full border-b-[3px] border-ink bg-canvas p-4 shadow-hard">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-2 border-ink bg-canvas-deep px-3 py-2.5 font-sign text-sm font-bold uppercase tracking-wider"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={signedIn ? accountHref : '/signin'}
              onClick={() => setOpen(false)}
              className="border-2 border-ink bg-navy px-3 py-2.5 font-sign text-sm font-bold uppercase tracking-wider text-canvas"
            >
              {signedIn ? 'My Account' : 'Sign In'}
            </Link>
            {signedIn ? null : (
              <Link
                href="/join"
                onClick={() => setOpen(false)}
                className="border-2 border-ink bg-safety px-3 py-2.5 font-sign text-sm font-bold uppercase tracking-wider"
              >
                Join as a Tradie
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </div>
  )
}
