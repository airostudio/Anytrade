import { BadgeCheck, Check } from 'lucide-react'
import type { NetworkMember } from '@/lib/homegirls-network'

/** Sage trust block: only claims what the member's record supports. */
export default function VerifiedBlock({ member }: { member: NetworkMember }) {
  const lines: string[] = []
  if (member.licence && member.insured) lines.push('Licence & Insurance Checked')
  else if (member.licence) lines.push('Licence Checked')
  else if (member.insured) lines.push('Insurance Checked')
  if (member.abn) lines.push('ABN Verified')

  if (lines.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-hg-slate/25 px-3 py-2.5 text-sm text-hg-slate">
        Verification in progress
      </p>
    )
  }

  return (
    <div className="rounded-xl bg-hg-sage-tint px-3 py-2.5 text-hg-sage-deep">
      <p className="flex items-center gap-1.5 text-sm font-bold">
        <BadgeCheck className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        Verified Tradie
      </p>
      <ul className="mt-1 space-y-0.5 text-[13px] font-medium">
        {lines.map((l) => (
          <li key={l} className="flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
            {l}
          </li>
        ))}
      </ul>
    </div>
  )
}
