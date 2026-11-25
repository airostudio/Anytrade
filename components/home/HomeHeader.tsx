'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { ESTABLISHED, telHref } from '@/lib/trust'
import { usePostJob } from './PostJobProvider'
import { btnCopper, btnPrimary } from './ui'

const NAV = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/trades', label: 'Trades' },
  { href: '/homegirls-network', label: 'Homegirls Network' },
  { href: '/join/tradie', label: 'For Tradies' },
  { href: '/signin', label: 'Sign In' },
] as const

export default function HomeHeader({
  phone,
  accent = 'terracotta',
}: {
  phone: string
  accent?: 'terracotta' | 'copper'
}) {
  const { open } = usePostJob()
  const pathname = usePathname()
  const cta = accent === 'copper' ? btnCopper : btnPrimary
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)
  const [menu, setMenu] = useState(false)

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menu])

  return (
    <header className="sticky top-0 z-40 border-b border-hairline bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-4 px-5 sm:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3" aria-label="AnyTrade home">
          <Image
            src="/images/logo-trimmed.png"
            alt="AnyTrade"
            width={1005}
            height={518}
            priority
            className="h-12 w-auto"
          />
          <span className="hidden rounded-full border border-charcoal/15 bg-alabaster px-2.5 py-1 text-xs font-semibold tracking-wide text-charcoal sm:inline">
            Est. {ESTABLISHED}
          </span>
        </Link>

        <nav aria-label="Main" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-[15px] font-semibold text-charcoal transition hover:bg-charcoal/5 ${
                isActive(item.href) ? 'bg-charcoal/[0.06] underline decoration-2 underline-offset-[10px]' : ''
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={telHref(phone)}
            className="ml-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-bold text-charcoal transition hover:bg-charcoal/5"
          >
            <Phone className="h-4 w-4 text-terracotta-deep" aria-hidden="true" />
            <span className="hidden xl:inline">{phone}</span>
            <span className="sr-only xl:hidden">Call {phone}</span>
          </a>
          <button type="button" className={`${cta} ml-2 !px-5 !py-2.5`} onClick={() => open()}>
            Post a Job
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <a
            href={telHref(phone)}
            aria-label={`Call ${phone}`}
            className="rounded-lg p-2.5 text-charcoal transition hover:bg-charcoal/5"
          >
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
          <button
            type="button"
            aria-expanded={menu}
            aria-controls="home-mobile-menu"
            aria-label={menu ? 'Close menu' : 'Open menu'}
            onClick={() => setMenu((m) => !m)}
            className="rounded-lg p-2.5 text-charcoal transition hover:bg-charcoal/5"
          >
            {menu ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menu ? (
        <div id="home-mobile-menu" className="animate-fade-in border-t border-hairline bg-white lg:hidden">
          <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenu(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`rounded-lg px-3 py-3 text-lg font-semibold text-charcoal hover:bg-charcoal/5 ${
                  isActive(item.href) ? 'bg-charcoal/[0.06]' : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={telHref(phone)}
              className="flex items-center gap-2 rounded-lg px-3 py-3 text-lg font-bold text-charcoal hover:bg-charcoal/5"
            >
              <Phone className="h-5 w-5 text-terracotta-deep" aria-hidden="true" />
              {phone}
            </a>
            <button
              type="button"
              className={`${cta} mt-2 w-full`}
              onClick={() => {
                setMenu(false)
                open()
              }}
            >
              Post a Job
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  )
}
