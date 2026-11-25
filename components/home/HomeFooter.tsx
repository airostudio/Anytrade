import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import { ESTABLISHED, formatAbn, isValidAbn, telHref } from '@/lib/trust'

const GROUPS = [
  {
    title: 'Homeowners',
    links: [
      { href: '/post-a-job', label: 'Post a job' },
      { href: '/find-a-tradie', label: 'Find a tradie' },
      { href: '/handyman', label: 'Home handyman jobs' },
      { href: '/how-it-works', label: 'How it works' },
    ],
  },
  {
    title: 'Tradies',
    links: [
      { href: '/join/tradie', label: 'Join AnyTrade' },
      { href: '/pricing', label: 'Memberships & leads' },
      { href: '/homegirls-network', label: 'Homegirls Network' },
      { href: '/signin', label: 'Sign in' },
    ],
  },
] as const

export default function HomeFooter({
  phone,
  email,
  abn,
}: {
  phone: string
  email: string
  abn: string
}) {
  // An ABN is only printed once it passes the official ATO checksum.
  const showAbn = isValidAbn(abn)

  return (
    <footer className="border-t border-hairline bg-alabaster-deep text-charcoal">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <p className="font-heritage text-2xl font-semibold tracking-tight">AnyTrade</p>
          <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-charcoal-mute">
            Australian owned and trading since {ESTABLISHED}. Honest prices, checked tradies and a real
            person on the end of the phone.
          </p>
        </div>

        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-charcoal-mute">{g.title}</p>
            <ul className="mt-4 space-y-2.5">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[15px] font-medium hover:text-terracotta-deep hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-charcoal-mute">Talk to us</p>
          <a
            href={telHref(phone)}
            className="mt-4 flex items-center gap-2.5 font-heritage text-2xl font-semibold tracking-tight hover:text-terracotta-deep"
          >
            <Phone className="h-5 w-5 text-terracotta-deep" aria-hidden="true" />
            {phone}
          </a>
          <p className="mt-1 text-sm text-charcoal-mute">Australian support line</p>
          <a
            href={`mailto:${email}`}
            className="mt-4 flex items-center gap-2.5 text-[15px] font-medium hover:text-terracotta-deep hover:underline"
          >
            <Mail className="h-4 w-4 text-charcoal-mute" aria-hidden="true" />
            {email}
          </a>
        </div>
      </div>

      <div className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-5 text-sm text-charcoal-mute sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>
            © {new Date().getFullYear()} AnyTrade
            {showAbn ? ` · ABN ${formatAbn(abn)}` : ''}
          </p>
          <p>Prices shown include GST. Quotes are agreed before work starts.</p>
        </div>
      </div>
    </footer>
  )
}
