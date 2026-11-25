import { CalendarCheck, Check, MapPin, ShieldCheck, Sprout } from 'lucide-react'
import type { NetworkMember } from '@/lib/homegirls-network'
import { VETTING_POINTS } from '@/lib/trust'
import { btnCopper } from '@/components/home/ui'
import Dialog from './Dialog'
import MemberPortrait from './MemberPortrait'
import VerifiedBlock from './VerifiedBlock'

export default function ProfileDrawer({
  member,
  onClose,
  onQuote,
}: {
  member: NetworkMember
  onClose: () => void
  onQuote: (m: NetworkMember) => void
}) {
  return (
    <Dialog
      variant="drawer"
      eyebrow="Homegirls Network member"
      title={member.name}
      onClose={onClose}
      footer={
        <button type="button" onClick={() => onQuote(member)} className={`${btnCopper} w-full`}>
          Request a Quote from {member.name.split(' ')[0]}
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex gap-4">
          <MemberPortrait member={member} className="aspect-[4/5] w-28 shrink-0 rounded-xl" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-hg-copper-deep">{member.tradeLabel}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-hg-slate">
              <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              {member.suburb}, {member.state} {member.postcode}
            </p>
            {member.years ? <p className="mt-0.5 text-sm text-hg-slate">{member.years}+ years in the trade</p> : null}
            {member.mentor ? (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-hg-sage-tint px-2.5 py-1 text-xs font-semibold text-hg-sage-deep">
                <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
                Mentors apprentices
              </p>
            ) : null}
          </div>
        </div>

        {member.sample ? (
          <p className="rounded-xl border border-hg-line bg-hg-cream px-4 py-3 text-sm text-hg-slate">
            <strong className="font-semibold text-hg-ink">Sample profile.</strong> This shows how a member
            profile looks. Requests sent here are matched by the AnyTrade team with a real member.
          </p>
        ) : null}

        <section aria-labelledby="pd-about">
          <h3 id="pd-about" className="text-sm font-bold uppercase tracking-[0.12em] text-hg-slate">
            About
          </h3>
          <p className="mt-2 leading-relaxed text-hg-ink">{member.bio}</p>
        </section>

        <VerifiedBlock member={member} />

        {member.qualifications.length > 0 ? (
          <section aria-labelledby="pd-quals">
            <h3 id="pd-quals" className="text-sm font-bold uppercase tracking-[0.12em] text-hg-slate">
              Qualifications
            </h3>
            <ul className="mt-2 space-y-1.5">
              {member.qualifications.map((q) => (
                <li key={q} className="flex items-start gap-2 text-[15px]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-hg-sage-deep" strokeWidth={2.5} aria-hidden="true" />
                  {q}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="pd-area">
          <h3 id="pd-area" className="text-sm font-bold uppercase tracking-[0.12em] text-hg-slate">
            Service area
          </h3>
          <p className="mt-2 text-[15px]">
            Based in {member.suburb}
            {member.serviceAreas.length ? `, also servicing ${member.serviceAreas.join(', ')}` : ''}.
          </p>
        </section>

        <section aria-labelledby="pd-avail">
          <h3 id="pd-avail" className="text-sm font-bold uppercase tracking-[0.12em] text-hg-slate">
            Availability
          </h3>
          <p className="mt-2 flex items-start gap-2 text-[15px]">
            <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-hg-slate" strokeWidth={1.75} aria-hidden="true" />
            <span>
              <strong className="font-semibold">{member.available ? 'Available for quotes.' : 'Currently booked out.'}</strong>{' '}
              {member.availabilityNote}
            </span>
          </p>
        </section>

        <section aria-labelledby="pd-trust" className="rounded-2xl border border-hg-line bg-hg-paper p-4">
          <h3 id="pd-trust" className="flex items-center gap-2 text-sm font-bold text-hg-ink">
            <ShieldCheck className="h-4 w-4 text-hg-sage-deep" aria-hidden="true" />
            Trust standards for every member
          </h3>
          <ul className="mt-3 space-y-2">
            {VETTING_POINTS.map((p) => (
              <li key={p.key} className="text-sm">
                <span className="font-semibold text-hg-ink">{p.title}.</span>{' '}
                <span className="text-hg-slate">{p.body}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Dialog>
  )
}
