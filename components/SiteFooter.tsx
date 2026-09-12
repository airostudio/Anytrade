import Link from 'next/link'
import Logo from './Logo'
import { TRADE_CATEGORIES } from '@/lib/constants'
import { getSettings } from '@/lib/repos/settings'

export default async function SiteFooter() {
  const settings = await getSettings()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-20 border-t-[3px] border-ink bg-navy text-canvas">
      <div className="hazard-tape" aria-hidden />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Logo size="sm" tone="light" />
            <p className="mt-4 max-w-xs text-sm text-canvas/80">{settings['site.tagline']}</p>
            <dl className="mt-5 space-y-1 text-sm text-canvas/80">
              <div className="flex gap-2">
                <dt className="font-sign uppercase tracking-wider">Phone</dt>
                <dd className="font-mono">{settings['site.phone']}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-sign uppercase tracking-wider">Email</dt>
                <dd className="font-mono">{settings['site.email']}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-sign uppercase tracking-wider">ABN</dt>
                <dd className="font-mono">{settings['site.abn']}</dd>
              </div>
            </dl>
          </div>

          <FooterColumn title="Popular Trades">
            {TRADE_CATEGORIES.slice(0, 8).map((c) => (
              <FooterLink key={c.slug} href={`/trades/${c.slug}`}>
                {c.name}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="For Homeowners">
            <FooterLink href="/post-a-job">Post a job</FooterLink>
            <FooterLink href="/find-a-tradie">Search the directory</FooterLink>
            <FooterLink href="/handyman">Home handyman jobs</FooterLink>
            <FooterLink href="/how-it-works">How it works</FooterLink>
            <FooterLink href="/contact">Contact us</FooterLink>
          </FooterColumn>

          <FooterColumn title="For Tradies">
            <FooterLink href="/join/tradie">Join AnyTrade</FooterLink>
            <FooterLink href="/pricing">Memberships &amp; leads</FooterLink>
            <FooterLink href="/how-it-works#tradies">Winning work</FooterLink>
            <FooterLink href="/homegirls">Homegirls network</FooterLink>
            <FooterLink href="/signin">Sign in</FooterLink>
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t-2 border-canvas/25 pt-6 text-xs text-canvas/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} AnyTrade Pty Ltd. Licensed, insured, and reasonably priced since 1968.
          </p>
          <p className="font-sign uppercase tracking-[0.2em]">
            Fair quotes · Honest ratings · No call-out surprises
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 border-b-2 border-safety pb-1 font-sign text-sm font-bold uppercase tracking-[0.2em] text-safety">
        {title}
      </h3>
      <ul className="space-y-1.5 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-canvas/85 underline-offset-4 hover:text-safety hover:underline">
        {children}
      </Link>
    </li>
  )
}
