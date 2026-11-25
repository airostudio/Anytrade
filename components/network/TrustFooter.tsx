import { BadgeCheck, FileCheck2, Phone, ShieldCheck } from 'lucide-react'
import { ESTABLISHED, formatAbn, isValidAbn, telHref } from '@/lib/trust'

/** Deep charcoal trust footer for the Homegirls Network page. */
export default function TrustFooter({ phone, abn }: { phone: string; abn: string }) {
  const abnOk = isValidAbn(abn)
  const emblems = [
    { icon: FileCheck2, title: 'ABN Verified', detail: abnOk ? `ABN ${formatAbn(abn)}` : null },
    { icon: BadgeCheck, title: 'Licensed', detail: null },
    { icon: ShieldCheck, title: 'Insured', detail: null },
  ]

  return (
    <footer className="bg-hg-ink text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
        <div className="flex items-center gap-3">
          <span className="font-heritage text-3xl font-semibold tracking-tight">Anytrade</span>
          <span className="rounded-full border border-white/25 px-2.5 py-1 text-xs font-semibold tracking-wide text-white/90">
            Est. {ESTABLISHED}
          </span>
        </div>

        <ul aria-label="Trust standards" className="flex flex-wrap items-start justify-center gap-x-10 gap-y-5">
          {emblems.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-hg-sage/60 bg-hg-sage/15 text-hg-sage-light">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                {detail ? <span className="block text-sm text-white/75">{detail}</span> : null}
              </span>
            </li>
          ))}
        </ul>

        <a
          href={telHref(phone)}
          className="group flex items-center gap-3 lg:justify-self-end"
          aria-label={`Direct support at ${phone}`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-hg-copper text-hg-on-copper">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm text-white/75">Direct support at</span>
            <span className="block font-heritage text-2xl font-semibold tracking-tight group-hover:underline">
              {phone}
            </span>
          </span>
        </a>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto w-full max-w-6xl px-5 py-4 text-sm text-white/70 sm:px-8">
          © {new Date().getFullYear()} AnyTrade · Australian owned since {ESTABLISHED}
        </p>
      </div>
    </footer>
  )
}
