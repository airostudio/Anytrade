import { CalendarClock, MapPin } from 'lucide-react'
import type { NetworkMember } from '@/lib/homegirls-network'
import { btnCopper } from '@/components/home/ui'
import MemberPortrait from './MemberPortrait'
import VerifiedBlock from './VerifiedBlock'

export default function MemberCard({
  member,
  onQuote,
  onProfile,
}: {
  member: NetworkMember
  onQuote: (m: NetworkMember) => void
  onProfile: (m: NetworkMember) => void
}) {
  return (
    <article
      aria-label={`${member.name}, ${member.tradeLabel}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-hg-line bg-white shadow-card transition hover:shadow-lift"
    >
      <div className="relative">
        <MemberPortrait member={member} />
        {member.sample ? (
          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-hg-slate">
            Sample
          </span>
        ) : null}
        <span
          className={`absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            member.available ? 'bg-hg-sage-deep text-white' : 'bg-white/95 text-hg-slate'
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${member.available ? 'bg-white' : 'bg-hg-slate/50'}`}
          />
          {member.available ? 'Available for quotes' : 'Booked out'}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heritage text-xl font-semibold leading-tight tracking-tight text-hg-ink">
          {member.name}
        </h3>
        <p className="mt-0.5 text-sm font-semibold text-hg-copper-deep">{member.tradeLabel}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-hg-slate">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          {member.suburb}, {member.state} {member.postcode}
        </p>
        {member.years ? (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-hg-slate">
            <CalendarClock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {member.years}+ years in the trade
          </p>
        ) : null}

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-hg-slate">{member.bio}</p>

        <div className="mt-4">
          <VerifiedBlock member={member} />
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            onClick={() => onQuote(member)}
            aria-label={`Request a Quote from ${member.name}`}
            className={`${btnCopper} w-full !px-4 !py-3 !text-[15px]`}
          >
            Request a Quote
          </button>
          <button
            type="button"
            onClick={() => onProfile(member)}
            aria-label={`View Profile of ${member.name}`}
            className="mt-2 w-full rounded-lg py-2 text-sm font-semibold text-hg-sage-deep underline decoration-hg-sage/50 underline-offset-4 transition hover:bg-hg-sage-tint"
          >
            View Profile
          </button>
        </div>
      </div>
    </article>
  )
}
