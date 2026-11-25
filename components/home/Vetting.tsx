import { BadgeCheck, FileCheck2, Phone, ShieldCheck, UserCheck } from 'lucide-react'
import { VETTING_POINTS, telHref } from '@/lib/trust'
import { IconTile, btnPrimary } from './ui'

const ICONS = {
  licence: BadgeCheck,
  abn: FileCheck2,
  insurance: ShieldCheck,
  history: UserCheck,
} as const

/** The 4-point vetting process, the heart of the trust story. */
export default function Vetting({ phone }: { phone: string }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-14">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-terracotta">Est. 1968</p>
        <h2 className="mt-2 font-heritage text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          Four checks before any tradie can quote.
        </h2>
        <p className="mt-4 text-lg leading-relaxed text-white/75">
          AnyTrade has been matching Australians with tradespeople for over 55 years. The badge only goes
          on when all four checks are done.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col">
          <a
            href={telHref(phone)}
            className={`${btnPrimary} justify-center`}
            aria-label={`Call our Australian support line on ${phone}`}
          >
            <Phone className="h-[18px] w-[18px]" aria-hidden="true" />
            Call {phone}
          </a>
        </div>
        <p className="mt-3 text-sm text-white/60">Talk to a real person at our Australian support line.</p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2">
        {VETTING_POINTS.map((p, i) => (
          <li key={p.key} className="rounded-2xl bg-white/[0.06] p-6 ring-1 ring-inset ring-white/10">
            <div className="flex items-center justify-between">
              <IconTile icon={ICONS[p.key]} tone="verified" />
              <span aria-hidden="true" className="font-heritage text-3xl font-semibold text-white/55">
                0{i + 1}
              </span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-white">
              <span className="sr-only">Check {i + 1}: </span>
              {p.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-white/70">{p.body}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
